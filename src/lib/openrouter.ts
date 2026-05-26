/**
 * LLM client — supports two providers behind one OpenAI-compatible API:
 *   • `openrouter`  → https://openrouter.ai/api/v1/chat/completions
 *   • `gemini`      → https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
 *
 * Both speak the same SSE shape, so the parser is shared. Provider selection
 * is driven by:
 *   • server side  → `LLM_PROVIDER` env var (see src/lib/env.ts)
 *   • client side  → `import.meta.env.VITE_LLM_PROVIDER`
 * Both default to `openrouter` for back-compat.
 *
 * File stays named `openrouter.ts` to avoid churning every import. The
 * provider-agnostic surface is exported alongside the legacy names.
 */

// ─── Providers ──────────────────────────────────────────────────────────

export const PROVIDERS = ["openrouter", "gemini"] as const;
export type Provider = (typeof PROVIDERS)[number];

export function isProvider(value: unknown): value is Provider {
	return (
		typeof value === "string" &&
		(PROVIDERS as readonly string[]).includes(value)
	);
}

const ENDPOINTS: Record<Provider, string> = {
	openrouter: "https://openrouter.ai/api/v1/chat/completions",
	gemini:
		"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
};

// ─── Model catalogues ───────────────────────────────────────────────────

export type LlmModel = {
	id: string;
	label: string;
	/**
	 * `true` for paid-only models (Gemini 2.5 Flash Lite under our setup).
	 * Premium models are capped at a lower per-visitor count to bound spend.
	 */
	premium?: boolean;
};

export const OPENROUTER_MODELS = [
	{
		id: "google/gemini-2.5-flash-lite",
		label: "Gemini 2.5 Flash Lite (default)",
	},
	{ id: "meta-llama/llama-3.3-8b-instruct", label: "Llama 3.3 8B" },
	{ id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
	{ id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
	{ id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
] as const satisfies readonly LlmModel[];

export const GEMINI_MODELS = [
	{
		id: "gemma-4-31b-it",
		label: "Gemma 4 31B (default · free)",
	},
	{
		id: "gemma-4-26b-a4b-it",
		label: "Gemma 4 26B (free)",
	},
	{
		id: "gemini-2.5-flash-lite",
		label: "Gemini 2.5 Flash Lite (premium · 5/day)",
		premium: true,
	},
] as const satisfies readonly LlmModel[];

/** True when the model is paid (counts toward the premium sub-budget). */
export function isPremiumModel(id: string): boolean {
	const all: readonly LlmModel[] = [...OPENROUTER_MODELS, ...GEMINI_MODELS];
	const hit = all.find((m) => m.id === id);
	return hit?.premium === true;
}

const MODELS_BY_PROVIDER: Record<Provider, readonly LlmModel[]> = {
	openrouter: OPENROUTER_MODELS,
	gemini: GEMINI_MODELS,
};

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]["id"];
export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];
export type LlmModelId = OpenRouterModelId | GeminiModelId;

export function getModelsForProvider(p: Provider): readonly LlmModel[] {
	return MODELS_BY_PROVIDER[p];
}

export function getDefaultModelForProvider(p: Provider): string {
	const models = MODELS_BY_PROVIDER[p];
	// Type-narrowed: every entry in MODELS_BY_PROVIDER has ≥ 1 model.
	return models[0]?.id ?? "";
}

export function isModelForProvider(p: Provider, id: string): boolean {
	return MODELS_BY_PROVIDER[p].some((m) => m.id === id);
}

/** Legacy alias preserved for callers that already validated against the
 *  OpenRouter model list. New code should use `isModelForProvider`. */
export function isOpenRouterModel(id: string): id is OpenRouterModelId {
	return isModelForProvider("openrouter", id);
}

// ─── Active-provider lookups ────────────────────────────────────────────

/**
 * Client-side active provider. Reads `import.meta.env.VITE_LLM_PROVIDER`
 * with `openrouter` as the fallback so existing setups keep working.
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

	const res = await fetch(endpoint, {
		method: "POST",
		signal: args.signal,
		headers,
		body: JSON.stringify({
			model: args.model,
			stream: true,
			messages: args.messages,
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

	yield* stripThoughtBlocks(parseSseStream(res.body, args.signal));
}

/**
 * Gemma 4 always leads its response with a `<thought>...</thought>` block
 * of internal reasoning that we don't want to render. Buffer incoming token
 * deltas until we've consumed the closing tag, then start yielding only the
 * visible content. Models that don't emit `<thought>` are unaffected.
 */
async function* stripThoughtBlocks(
	source: AsyncGenerator<LlmEvent, void, void>,
): AsyncGenerator<LlmEvent, void, void> {
	let buffer = "";
	let stripped = false;
	for await (const ev of source) {
		if (ev.type !== "token") {
			yield ev;
			continue;
		}
		if (stripped) {
			yield ev;
			continue;
		}
		buffer += ev.text;
		// Wait until we know whether this response opens with `<thought>`.
		if (buffer.length < 10 && !buffer.startsWith("<")) {
			stripped = true;
			yield { type: "token", text: buffer };
			buffer = "";
			continue;
		}
		if (!buffer.startsWith("<thought>") && !"<thought>".startsWith(buffer)) {
			// Prefix doesn't match the opening tag — release as-is.
			stripped = true;
			yield { type: "token", text: buffer };
			buffer = "";
			continue;
		}
		const closeIdx = buffer.indexOf("</thought>");
		if (closeIdx === -1) {
			// Still inside the thought; keep buffering, don't yield.
			continue;
		}
		const tail = buffer.slice(closeIdx + "</thought>".length);
		stripped = true;
		buffer = "";
		if (tail.length > 0) yield { type: "token", text: tail };
	}
	if (!stripped && buffer.length > 0) {
		// Defensive: stream ended mid-buffer. Emit whatever we held back.
		yield { type: "token", text: buffer };
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
			if (outcome.kind === "token") {
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
				choices?: Array<{ delta?: { content?: string } }>;
				usage?: LlmUsage;
			};
			if (json.usage) usage = json.usage;
			const text = json.choices?.[0]?.delta?.content;
			if (typeof text === "string" && text.length > 0) {
				return { kind: "token", text, usage };
			}
		} catch {
			// skip malformed frame
		}
	}
	return usage ? { kind: "usage", usage } : { kind: "skip" };
}
