/**
 * OpenRouter SSE client.
 *
 * Two surfaces:
 *   - `OPENROUTER_MODELS` + `isOpenRouterModel` — pure data + type guard,
 *     safe to import from client code (the `/model` command needs the list).
 *   - `streamOpenRouter` — async generator over a Chat Completions SSE
 *     stream. Used by `src/routes/api.agent.ts`; not imported by client code.
 *
 * No env access here on purpose: the caller (server route) injects the
 * API key. That keeps the module isomorphic for the allowlist export.
 */

export type OpenRouterModel = {
	id: string;
	label: string;
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
] as const satisfies readonly OpenRouterModel[];

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]["id"];

export function isOpenRouterModel(id: string): id is OpenRouterModelId {
	return OPENROUTER_MODELS.some((m) => m.id === id);
}

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type OpenRouterUsage = {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
};

export type OpenRouterEvent =
	| { type: "token"; text: string }
	| { type: "done"; usage?: OpenRouterUsage };

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export type StreamArgs = {
	apiKey: string;
	model: string;
	messages: ChatMessage[];
	signal?: AbortSignal;
	referer?: string;
	title?: string;
};

/**
 * POST a streaming chat completion and yield parsed token / done events.
 * Cancelling the passed `signal` aborts the underlying fetch.
 */
export async function* streamOpenRouter(
	args: StreamArgs,
): AsyncGenerator<OpenRouterEvent, void, void> {
	const res = await fetch(ENDPOINT, {
		method: "POST",
		signal: args.signal,
		headers: {
			Authorization: `Bearer ${args.apiKey}`,
			"Content-Type": "application/json",
			...(args.referer ? { "HTTP-Referer": args.referer } : {}),
			...(args.title ? { "X-Title": args.title } : {}),
		},
		body: JSON.stringify({
			model: args.model,
			stream: true,
			messages: args.messages,
		}),
	});

	if (!res.ok || !res.body) {
		const detail = res.body ? await safeText(res) : "";
		throw new Error(
			`OpenRouter responded ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
		);
	}

	yield* parseSseStream(res.body, args.signal);
}

async function safeText(res: Response): Promise<string> {
	try {
		return await res.text();
	} catch {
		return "";
	}
}

type FrameOutcome =
	| { kind: "token"; text: string; usage?: OpenRouterUsage }
	| { kind: "usage"; usage: OpenRouterUsage }
	| { kind: "done"; usage?: OpenRouterUsage }
	| { kind: "skip" };

/**
 * Parse an OpenAI-style SSE stream into `OpenRouterEvent`s.
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
): AsyncGenerator<OpenRouterEvent, void, void> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let lastUsage: OpenRouterUsage | undefined;

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
	let usage: OpenRouterUsage | undefined;
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
				usage?: OpenRouterUsage;
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
