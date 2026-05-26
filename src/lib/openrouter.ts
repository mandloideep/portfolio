/**
 * Provider-agnostic LLM client speaking the OpenAI Chat Completions wire
 * format. Two upstream providers:
 *   • `openrouter`  → https://openrouter.ai/api/v1/chat/completions
 *   • `gemini`      → https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
 *
 * Each model in the unified catalog (`src/lib/agent/models.ts`) carries its
 * own `provider` — `streamLlm({ provider, ... })` simply dispatches to the
 * matching endpoint. File stays named `openrouter.ts` to avoid churning
 * every import; the catalog + types are re-exported from `agent/models.ts`.
 */

import {
	getModel,
	isModelAllowed,
	isPremiumModel,
	isProvider,
	type LlmModel,
	MODELS,
	PROVIDERS,
	type Provider,
} from "#/lib/agent/models";

export { PROVIDERS, isProvider, isPremiumModel, isModelAllowed };
export type { Provider, LlmModel };

/** Legacy export retained for older tests that imported the per-provider
 *  table directly. Derived from the unified catalog. */
export const OPENROUTER_MODELS: readonly LlmModel[] = MODELS.filter(
	(m) => m.provider === "openrouter",
);
/** @see OPENROUTER_MODELS */
export const GEMINI_MODELS: readonly LlmModel[] = MODELS.filter(
	(m) => m.provider === "gemini",
);

const ENDPOINTS: Record<Provider, string> = {
	openrouter: "https://openrouter.ai/api/v1/chat/completions",
	gemini:
		"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
};

// ─── Legacy compat shims ────────────────────────────────────────────────
// Some callers (`/model list` slash command, status footer label lookups,
// older imports in the env validator) still ask "what models does provider
// P expose?". We derive the per-provider view from the unified catalog so
// adding a model in one place updates every consumer.

export function getModelsForProvider(p: Provider): readonly LlmModel[] {
	return MODELS.filter((m) => m.provider === p);
}

export function getDefaultModelForProvider(p: Provider): string {
	const first = MODELS.find((m) => m.provider === p);
	return first?.id ?? "";
}

export function isModelForProvider(p: Provider, id: string): boolean {
	return getModel(id)?.provider === p;
}

/** Legacy alias preserved for callers that validated against the
 *  OpenRouter-only list. New code should use `isModelAllowed`. */
export function isOpenRouterModel(id: string): boolean {
	return isModelForProvider("openrouter", id);
}

/**
 * Client-side default provider (only used by the legacy `/model` command for
 * its info line). Reads `import.meta.env.VITE_LLM_PROVIDER` with `openrouter`
 * as the fallback so existing setups keep working.
 */
export function getActiveProviderClient(): Provider {
	const raw = (import.meta as { env?: Record<string, string | undefined> }).env
		?.VITE_LLM_PROVIDER;
	return isProvider(raw) ? raw : "openrouter";
}

// ─── Chat shapes ────────────────────────────────────────────────────────

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type LlmUsage = {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
};

export type LlmEvent =
	| { type: "thinking"; text: string }
	| { type: "token"; text: string }
	| { type: "done"; usage?: LlmUsage };

/** Legacy alias preserved for tests + callers that imported the old name. */
export type OpenRouterUsage = LlmUsage;
export type OpenRouterEvent = LlmEvent;

export type StreamArgs = {
	provider?: Provider;
	apiKey: string;
	model: string;
	messages: ChatMessage[];
	signal?: AbortSignal;
	referer?: string;
	title?: string;
	maxTokens?: number;
	temperature?: number;
	/**
	 * OpenRouter only: additional model ids to fall back to on error. The
	 * upstream walks `[model, ...fallbackModels]` in order and serves the
	 * first one that succeeds — billed only for whichever model actually
	 * responded. Ignored for the gemini provider.
	 *
	 * See: https://openrouter.ai/docs (model routing / `models` array).
	 */
	fallbackModels?: readonly string[];
};

/**
 * POST a streaming chat completion against the active provider and yield
 * parsed `token` / `done` events. Defaults to `openrouter` for backward
 * compatibility; `provider: "gemini"` swaps the endpoint and drops the
 * OpenRouter-specific attribution headers.
 */
export async function* streamLlm(
	args: StreamArgs,
): AsyncGenerator<LlmEvent, void, void> {
	const provider = args.provider ?? "openrouter";
	const endpoint = ENDPOINTS[provider];
	const headers: Record<string, string> = {
		Authorization: `Bearer ${args.apiKey}`,
		"Content-Type": "application/json",
	};
	// OpenRouter-specific attribution headers (Gemini ignores them).
	if (provider === "openrouter") {
		if (args.referer) headers["HTTP-Referer"] = args.referer;
		if (args.title) headers["X-Title"] = args.title;
	}

	const hasOrFallbacks =
		provider === "openrouter" &&
		Array.isArray(args.fallbackModels) &&
		args.fallbackModels.length > 0;

	const res = await fetch(endpoint, {
		method: "POST",
		signal: args.signal,
		headers,
		body: JSON.stringify({
			model: args.model,
			stream: true,
			messages: args.messages,
			...(hasOrFallbacks
				? { models: [args.model, ...(args.fallbackModels ?? [])] }
				: {}),
			...(typeof args.maxTokens === "number"
				? { max_tokens: args.maxTokens }
				: {}),
			...(typeof args.temperature === "number"
				? { temperature: args.temperature }
				: {}),
		}),
	});

	if (!res.ok || !res.body) {
		const detail = res.body ? await safeText(res) : "";
		throw new Error(
			`${provider} responded ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
		);
	}

	yield* splitThinkingFromContent(parseSseStream(res.body, args.signal));
}

/**
 * Gemma 4 leads its response with a `<thought>...</thought>` block of
 * internal reasoning. Some providers (OpenRouter on nemotron, others) emit
 * reasoning in a sibling `delta.reasoning` field — handled in `parseFrame`
 * which yields those as `type: "thinking"` directly.
 *
 * For the `<thought>` variant, buffer incoming token deltas until we've
 * decided whether the response opens with a thought block; emit buffered
 * thought content as `thinking` events and the post-`</thought>` tail as
 * `token` events. Models that don't emit `<thought>` pass through
 * unchanged.
 */
export async function* splitThinkingFromContent(
	source: AsyncGenerator<LlmEvent, void, void>,
): AsyncGenerator<LlmEvent, void, void> {
	let buffer = "";
	let inThought = false;
	let decided = false;
	for await (const ev of source) {
		if (ev.type === "thinking") {
			// Provider emitted reasoning in a sibling field — pass through.
			yield ev;
			continue;
		}
		if (ev.type !== "token") {
			yield ev;
			continue;
		}
		if (decided && !inThought) {
			yield ev;
			continue;
		}
		buffer += ev.text;
		if (!decided) {
			// Wait until we know whether this response opens with `<thought>`.
			if (buffer.length < 10 && !buffer.startsWith("<")) {
				decided = true;
				inThought = false;
				yield { type: "token", text: buffer };
				buffer = "";
				continue;
			}
			if (!buffer.startsWith("<thought>") && !"<thought>".startsWith(buffer)) {
				decided = true;
				inThought = false;
				yield { type: "token", text: buffer };
				buffer = "";
				continue;
			}
			if (buffer.startsWith("<thought>")) {
				decided = true;
				inThought = true;
				buffer = buffer.slice("<thought>".length);
				if (buffer.length > 0 && !buffer.includes("</thought>")) {
					yield { type: "thinking", text: buffer };
					buffer = "";
				}
				// fall through to thinking-buffer handling below
			} else {
				// Still might be the opening tag; keep buffering.
				continue;
			}
		}
		if (inThought) {
			const closeIdx = buffer.indexOf("</thought>");
			if (closeIdx === -1) {
				// Stream the thinking content as it arrives.
				if (buffer.length > 0) {
					yield { type: "thinking", text: buffer };
					buffer = "";
				}
				continue;
			}
			// Emit the slice before the close tag as thinking; switch to token.
			const head = buffer.slice(0, closeIdx);
			const tail = buffer.slice(closeIdx + "</thought>".length);
			if (head.length > 0) yield { type: "thinking", text: head };
			inThought = false;
			buffer = "";
			if (tail.length > 0) yield { type: "token", text: tail };
		}
	}
	// Stream ended mid-buffer — flush whatever we held back so we don't
	// silently drop a partial reply.
	if (buffer.length > 0) {
		yield { type: inThought ? "thinking" : "token", text: buffer };
	}
}

/** Legacy alias preserved for tests and the `api.agent.ts` import. */
export const streamOpenRouter = streamLlm;

/**
 * Non-streaming chat completion. Used by the lightweight on-topic classifier
 * where we only need a single SAFE/UNSAFE token and don't care about
 * incremental output. Returns the concatenated assistant text.
 */
export async function completeLlm(args: StreamArgs): Promise<string> {
	const provider = args.provider ?? "openrouter";
	const endpoint = ENDPOINTS[provider];
	const headers: Record<string, string> = {
		Authorization: `Bearer ${args.apiKey}`,
		"Content-Type": "application/json",
	};
	if (provider === "openrouter") {
		if (args.referer) headers["HTTP-Referer"] = args.referer;
		if (args.title) headers["X-Title"] = args.title;
	}

	const res = await fetch(endpoint, {
		method: "POST",
		signal: args.signal,
		headers,
		body: JSON.stringify({
			model: args.model,
			stream: false,
			messages: args.messages,
			...(typeof args.maxTokens === "number"
				? { max_tokens: args.maxTokens }
				: {}),
			...(typeof args.temperature === "number"
				? { temperature: args.temperature }
				: {}),
		}),
	});

	if (!res.ok) {
		const detail = await safeText(res);
		throw new Error(
			`${provider} responded ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
		);
	}
	const json = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const raw = json.choices?.[0]?.message?.content ?? "";
	return stripThoughtFromString(raw).trim();
}

/** Strip a leading `<thought>...</thought>` block from a non-streaming reply. */
export function stripThoughtFromString(s: string): string {
	const trimmed = s.trimStart();
	if (!trimmed.startsWith("<thought>")) return s;
	const closeIdx = trimmed.indexOf("</thought>");
	if (closeIdx === -1) return ""; // Whole reply was reasoning, no answer leaked.
	return trimmed.slice(closeIdx + "</thought>".length);
}

async function safeText(res: Response): Promise<string> {
	try {
		return await res.text();
	} catch {
		return "";
	}
}

// ─── SSE parser (shared across providers) ───────────────────────────────

type FrameOutcome =
	| { kind: "thinking"; text: string; usage?: LlmUsage }
	| { kind: "token"; text: string; usage?: LlmUsage }
	| { kind: "usage"; usage: LlmUsage }
	| { kind: "done"; usage?: LlmUsage }
	| { kind: "skip" };

/**
 * Parse an OpenAI-style SSE stream into `LlmEvent`s.
 *
 * Splits on `\n\n` event boundaries, then on `\n` lines, only consuming
 * `data:` lines. JSON parse errors and empty deltas are skipped silently
 * (stable against keep-alive comments and partial frames). Usage telemetry
 * is tracked across frames so the final `done` event sees it even when it
 * arrives in a frame that has no token content.
 *
 * If `signal` is passed, aborting it cancels the underlying reader and
 * makes the next iteration throw `AbortError`.
 */
export async function* parseSseStream(
	body: ReadableStream<Uint8Array>,
	signal?: AbortSignal,
): AsyncGenerator<LlmEvent, void, void> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let lastUsage: LlmUsage | undefined;

	const onAbort = () => {
		reader.cancel("aborted").catch(() => {});
	};
	signal?.addEventListener("abort", onAbort);

	try {
		while (true) {
			if (signal?.aborted) {
				throw new DOMException("Aborted", "AbortError");
			}
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			let boundary = buffer.indexOf("\n\n");
			while (boundary !== -1) {
				const frame = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const outcome = parseFrame(frame);
				if (outcome.kind === "usage") {
					lastUsage = outcome.usage;
				} else if (outcome.kind === "thinking") {
					if (outcome.usage) lastUsage = outcome.usage;
					yield { type: "thinking", text: outcome.text };
				} else if (outcome.kind === "token") {
					if (outcome.usage) lastUsage = outcome.usage;
					yield { type: "token", text: outcome.text };
				} else if (outcome.kind === "done") {
					yield { type: "done", usage: lastUsage ?? outcome.usage };
					return;
				}
				boundary = buffer.indexOf("\n\n");
			}
		}
		// flush trailing frame, if any
		const tail = buffer.trim();
		if (tail.length > 0) {
			const outcome = parseFrame(tail);
			if (outcome.kind === "thinking") {
				if (outcome.usage) lastUsage = outcome.usage;
				yield { type: "thinking", text: outcome.text };
			} else if (outcome.kind === "token") {
				if (outcome.usage) lastUsage = outcome.usage;
				yield { type: "token", text: outcome.text };
			} else if (outcome.kind === "done") {
				yield { type: "done", usage: lastUsage ?? outcome.usage };
				return;
			} else if (outcome.kind === "usage") {
				lastUsage = outcome.usage;
			}
		}
	} finally {
		signal?.removeEventListener("abort", onAbort);
		reader.releaseLock();
	}
}

function parseFrame(frame: string): FrameOutcome {
	let usage: LlmUsage | undefined;
	for (const line of frame.split("\n")) {
		if (!line.startsWith("data:")) continue;
		const payload = line.slice(5).trim();
		if (payload === "[DONE]") {
			return { kind: "done", usage };
		}
		if (!payload) continue;
		try {
			const json = JSON.parse(payload) as {
				choices?: Array<{
					delta?: { content?: string; reasoning?: string };
				}>;
				usage?: LlmUsage;
			};
			if (json.usage) usage = json.usage;
			const delta = json.choices?.[0]?.delta;
			// Providers that surface reasoning in a sibling field (e.g.
			// OpenRouter's nemotron) — emit as `thinking` so the splitter
			// keeps them out of the visible answer.
			const reasoning = delta?.reasoning;
			if (typeof reasoning === "string" && reasoning.length > 0) {
				return { kind: "thinking", text: reasoning, usage };
			}
			const text = delta?.content;
			if (typeof text === "string" && text.length > 0) {
				return { kind: "token", text, usage };
			}
		} catch {
			// skip malformed frame
		}
	}
	return usage ? { kind: "usage", usage } : { kind: "skip" };
}
