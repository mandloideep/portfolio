import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { classifyPrompt } from "#/lib/classifier";
import { assembleContext } from "#/lib/context";
import { getLlmConfig, getServerEnv } from "#/lib/env";
import { lookupIp } from "#/lib/ipinfo";
import { checkAndRecordLlmCall } from "#/lib/llm-rate-limit";
import {
	type ChatMessage,
	isModelForProvider,
	isPremiumModel,
	streamLlm,
} from "#/lib/openrouter";
import {
	hasDisallowedContent,
	isBrowserUserAgent,
	wordCount,
} from "#/lib/prompt-guards";
import {
	addUsage,
	checkRateLimit,
	getClientIp,
	hashIp,
	isDailyBudgetExhausted,
	type RateCheck,
} from "#/lib/rate-limit";

/**
 * POST /api/agent — streams an LLM chat completion as SSE.
 *
 * Picks the provider from `LLM_PROVIDER` (defaults to `openrouter`) and
 * dispatches to the matching endpoint. The wire format is identical
 * (OpenAI-compatible Chat Completions) for both, so callers don't need
 * to know which one served the response.
 *
 * Event sequence:
 *   event: activity  data: {"step":"reading","files":[...]}
 *   event: activity  data: {"step":"calling","model":"...","provider":"..."}
 *   event: token     data: "<chunk>"
 *   ...
 *   event: done      data: {"tokens":N}
 * On failure:
 *   event: error     data: {"message":"..."}
 */

const RequestSchema = z.object({
	message: z.string().min(1).max(4000),
	history: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string().max(4000),
			}),
		)
		.max(20)
		.optional(),
	model: z.string().optional(),
	// Honeypot — real browsers never set this. Bots scraping the form often do.
	_hp: z.string().optional(),
});

const SSE_HEADERS = {
	"Content-Type": "text/event-stream; charset=utf-8",
	"Cache-Control": "no-store",
	Connection: "keep-alive",
	"X-Accel-Buffering": "no",
} as const;

function sseSingle(event: string, data: unknown): Response {
	const body = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	return new Response(body, { status: 200, headers: SSE_HEADERS });
}

export async function handleAgentRequest(request: Request): Promise<Response> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError(400, "invalid_json");
	}
	const parsed = RequestSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError(400, "invalid_request");
	}

	// Honeypot: real browsers never fill this. Reject silently so bots don't
	// learn what tripped them.
	if (parsed.data._hp && parsed.data._hp.length > 0) {
		return sseSingle("error", { message: "rejected" });
	}

	// User-Agent allowlist. Cheap deterrent against scripted abuse.
	const ua = request.headers.get("user-agent") ?? "";
	if (!isBrowserUserAgent(ua)) {
		return sseSingle("error", { message: "rejected" });
	}

	let env: ReturnType<typeof getServerEnv>;
	let provider: ReturnType<typeof getLlmConfig>["provider"];
	let apiKey: string;
	let defaultModel: string;
	let assembled: ReturnType<typeof assembleContext>;
	try {
		env = getServerEnv();
		const cfg = getLlmConfig(env);
		provider = cfg.provider;
		apiKey = cfg.apiKey;
		defaultModel = cfg.defaultModel;
		assembled = assembleContext(parsed.data.message);
	} catch (err) {
		const safe =
			process.env.NODE_ENV === "production"
				? "agent_unavailable"
				: err instanceof Error
					? err.message
					: "agent_unavailable";
		return sseSingle("error", { message: safe });
	}

	// Word cap — server-authoritative ceiling. Client also enforces softly.
	if (wordCount(parsed.data.message) > env.WORD_CAP) {
		return sseSingle("error", {
			message: "prompt_too_long",
			cap: env.WORD_CAP,
		});
	}

	// PII / profanity regex. Reject before paying for any LLM call.
	const flagged = hasDisallowedContent(parsed.data.message);
	if (flagged) {
		return sseSingle("error", { message: "rejected", reason: flagged });
	}

	// Global daily token budget circuit breaker. Trip → all requests bounced.
	const budgetTripped = await isDailyBudgetExhausted(env.DAILY_TOKEN_BUDGET);
	if (budgetTripped) {
		return sseSingle("rate_limited", {
			remaining: 0,
			resetsAt: nextUtcMidnight().toISOString(),
			reason: "daily_budget",
		});
	}

	// Resolve the requested model before rate-limiting so we can apply the
	// premium sub-budget when paid models are in play.
	const model =
		parsed.data.model && isModelForProvider(provider, parsed.data.model)
			? parsed.data.model
			: defaultModel;
	const isPremium = isPremiumModel(model);

	// Per-IP rate limit + cooldown + token cap + premium sub-budget.
	const ip = getClientIp(request);
	const salt = env.RATE_LIMIT_SALT ?? "portfolio-default-salt";
	const ipHash = hashIp(ip, salt);

	let rate: RateCheck;
	try {
		rate = await checkRateLimit({
			ipHash,
			limit: env.RATE_LIMIT_MAX,
			windowMs: env.RATE_LIMIT_WINDOW_MS,
			cooldownMs: env.MIN_REQUEST_INTERVAL_MS,
			perIpTokenBudget: env.PER_IP_TOKEN_BUDGET,
			premiumLimit: env.PREMIUM_LIMIT,
			isPremium,
			lookupPrivacy:
				env.BLOCK_VPN && env.IPINFO_TOKEN
					? async () => lookupIp(ip, env.IPINFO_TOKEN ?? "")
					: undefined,
		});
	} catch (err) {
		// Storage failures shouldn't black-hole the agent — log and fail-open.
		// eslint-disable-next-line no-console
		console.error("[api.agent] rate-limit check failed", err);
		rate = {
			allowed: true,
			remaining: env.RATE_LIMIT_MAX,
			resetsAt: new Date(Date.now() + env.RATE_LIMIT_WINDOW_MS),
		};
	}

	if (!rate.allowed) {
		return sseSingle("rate_limited", {
			remaining: rate.remaining,
			resetsAt: rate.resetsAt.toISOString(),
			reason: rate.blockedReason ?? "limit_reached",
		});
	}

	// Model-level rate-limit (Google's per-(provider, model) RPM/RPD).
	// Checked once for the main reply now; the classifier call below has its
	// own check immediately before firing.
	const mainQuota = await checkAndRecordLlmCall({ provider, model });
	if (!mainQuota.allowed) {
		return sseSingle("rate_limited", {
			remaining: 0,
			resetsAt: new Date(Date.now() + mainQuota.retryAfterMs).toISOString(),
			reason: `model_${mainQuota.reason}`,
			model,
		});
	}

	// On-topic pre-flight classifier. Pinned to LLM_FREE_MODEL so it never
	// burns the premium quota — even if the user picked a premium model for
	// the main reply. Fail-open on errors.
	const classifierModel =
		env.LLM_FREE_MODEL ?? env.CLASSIFIER_MODEL ?? "gemma-4-31b-it";
	if (env.CLASSIFIER_ENABLED) {
		// Skip classifier when it would exceed model rate limits — better to
		// let the prompt through than to refuse over gating overhead.
		const classifierQuota = await checkAndRecordLlmCall({
			provider,
			model: classifierModel,
		});
		if (classifierQuota.allowed) {
			try {
				const verdict = await classifyPrompt({
					prompt: parsed.data.message,
					provider,
					apiKey,
					model: classifierModel,
					signal: request.signal,
				});
				if (verdict === "UNSAFE") {
					return sseSingle("error", { message: "off_topic" });
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.warn("[api.agent] classifier failed (fail-open)", err);
			}
		}
	}

	const { system, contextDocs, files } = assembled;
	const messages: ChatMessage[] = [
		{
			role: "system",
			content: contextDocs
				? `${system}\n\n# Context\n\n${contextDocs}`
				: system,
		},
		...(parsed.data.history ?? []),
		{ role: "user", content: parsed.data.message },
	];

	// Compose abort signal: client disconnect OR per-request timeout.
	const timeout = AbortSignal.timeout(env.REQUEST_TIMEOUT_MS);
	const upstreamSignal: AbortSignal =
		typeof (
			AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }
		).any === "function"
			? (
					AbortSignal as unknown as { any: (s: AbortSignal[]) => AbortSignal }
				).any([request.signal, timeout])
			: request.signal;

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const enc = new TextEncoder();
			const write = (event: string, data: unknown) => {
				controller.enqueue(
					enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
				);
			};

			write("quota", {
				remaining: rate.remaining,
				resetsAt: rate.resetsAt.toISOString(),
			});

			try {
				write("activity", { step: "reading", files });
				write("activity", { step: "calling", model, provider });

				let totalTokens = 0;
				let lastUsage:
					| {
							total_tokens?: number;
							completion_tokens?: number;
					  }
					| undefined;
				for await (const ev of streamLlm({
					provider,
					apiKey,
					model,
					messages,
					signal: upstreamSignal,
					maxTokens: env.MAX_OUTPUT_TOKENS,
				})) {
					if (ev.type === "token") {
						totalTokens += 1;
						write("token", ev.text);
					} else {
						lastUsage = ev.usage;
					}
				}
				const used = lastUsage?.total_tokens ?? totalTokens;
				write("done", { tokens: used });
				// Tally usage for the daily budget + per-IP cap. Fire-and-forget so
				// a DB blip doesn't stall the response close.
				addUsage({ ipHash, tokens: used }).catch((err) => {
					// eslint-disable-next-line no-console
					console.error("[api.agent] addUsage failed", err);
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : "stream_failed";
				write("error", { message });
			} finally {
				controller.close();
			}
		},
		cancel() {
			// The fetch above is bound to upstreamSignal; cancelling the response
			// stream surfaces back through the consumer when they `getReader()`.
		},
	});

	return new Response(stream, { status: 200, headers: SSE_HEADERS });
}

function nextUtcMidnight(): Date {
	const now = new Date();
	const t = new Date(now);
	t.setUTCHours(24, 0, 0, 0);
	return t;
}

function jsonError(status: number, code: string): Response {
	return new Response(JSON.stringify({ error: code }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const Route = createFileRoute("/api/agent")({
	server: {
		handlers: {
			POST: ({ request }) => handleAgentRequest(request),
		},
	},
});
