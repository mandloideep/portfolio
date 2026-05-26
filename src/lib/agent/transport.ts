/**
 * Headless agent transport. Pure async generator that POSTs to `/api/agent`
 * and yields typed events parsed from the SSE response. Zero DOM/store
 * dependencies — usable from the terminal surface, the chat surface, a
 * unit test, or a Node script.
 *
 * The provider mounts this over an `AbortController` and folds the events
 * into provider state. Consumers should not call this directly; use
 * `useAgentSession()` from `agent-engine-provider.tsx`.
 */

export type AgentRole = "user" | "assistant";

export type AgentHistoryEntry = {
	role: AgentRole;
	content: string;
};

export type AgentActivityEvent = {
	type: "activity";
	step: "reading" | "calling" | "checking";
	files?: string[];
	model?: string;
	note?: string;
};

export type AgentQuotaEvent = {
	type: "quota";
	remaining: number | null;
	limit: number | null;
	unlimited: boolean;
	tier: "free" | "premium";
	resetsAt: string | null;
	model?: string;
};

export type AgentRateLimitedEvent = {
	type: "rate_limited";
	reason: string;
	remaining: number | null;
	resetsAt: string | null;
	tier?: "free" | "premium";
	model?: string;
};

export type AgentDoneEvent = {
	type: "done";
	tokens: number;
	thinkingTokens?: number;
	thinkingMs?: number;
};

export type AgentErrorEvent = {
	type: "error";
	code: string;
	cap?: number;
	model?: string;
};

export type AgentStreamEvent =
	| { type: "thinking"; text: string }
	| { type: "token"; text: string }
	| AgentActivityEvent
	| AgentQuotaEvent
	| AgentRateLimitedEvent
	| AgentDoneEvent
	| AgentErrorEvent;

export type StreamAgentArgs = {
	message: string;
	history: AgentHistoryEntry[];
	model: string;
	signal: AbortSignal;
};

/**
 * POST `/api/agent` and yield typed events parsed from the SSE response.
 *
 * Errors surface in two distinct shapes:
 *   • Network/abort failures throw normally — caller catches.
 *   • Server-side errors arrive as `{ type: "error" }` events inside the
 *     stream — caller routes them as UI state instead of throwing.
 */
export async function* streamAgent(
	args: StreamAgentArgs,
): AsyncGenerator<AgentStreamEvent, void, void> {
	const res = await fetch("/api/agent", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			message: args.message,
			history: args.history,
			model: args.model,
		}),
		signal: args.signal,
	});

	if (!res.ok || !res.body) {
		yield {
			type: "error",
			code: `http_${res.status}`,
		};
		return;
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	const onAbort = () => {
		reader.cancel().catch(() => {});
	};
	args.signal.addEventListener("abort", onAbort);

	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			let boundary = buffer.indexOf("\n\n");
			while (boundary !== -1) {
				const frame = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const parsed = parseFrame(frame);
				if (parsed) yield parsed;
				boundary = buffer.indexOf("\n\n");
			}
		}
	} finally {
		args.signal.removeEventListener("abort", onAbort);
		reader.releaseLock();
	}
}

function parseFrame(frame: string): AgentStreamEvent | null {
	let event = "message";
	let dataLine = "";
	for (const line of frame.split("\n")) {
		if (line.startsWith("event:")) event = line.slice(6).trim();
		else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
	}
	if (!dataLine) return null;
	let data: unknown;
	try {
		data = JSON.parse(dataLine);
	} catch {
		data = dataLine;
	}
	switch (event) {
		case "thinking":
			return {
				type: "thinking",
				text: typeof data === "string" ? data : String(data ?? ""),
			};
		case "token":
			return {
				type: "token",
				text: typeof data === "string" ? data : String(data ?? ""),
			};
		case "activity": {
			const o = (data ?? {}) as Partial<AgentActivityEvent>;
			if (
				o.step === "reading" ||
				o.step === "calling" ||
				o.step === "checking"
			) {
				return {
					type: "activity",
					step: o.step,
					...(o.files ? { files: o.files } : {}),
					...(o.model ? { model: o.model } : {}),
					...(o.note ? { note: o.note } : {}),
				};
			}
			return null;
		}
		case "quota": {
			const o = (data ?? {}) as Partial<AgentQuotaEvent>;
			return {
				type: "quota",
				remaining: typeof o.remaining === "number" ? o.remaining : null,
				limit: typeof o.limit === "number" ? o.limit : null,
				unlimited: o.unlimited === true,
				tier: o.tier === "premium" ? "premium" : "free",
				resetsAt: typeof o.resetsAt === "string" ? o.resetsAt : null,
				...(typeof o.model === "string" ? { model: o.model } : {}),
			};
		}
		case "rate_limited": {
			const o = (data ?? {}) as Partial<AgentRateLimitedEvent>;
			return {
				type: "rate_limited",
				reason: typeof o.reason === "string" ? o.reason : "limit_reached",
				remaining: typeof o.remaining === "number" ? o.remaining : null,
				resetsAt: typeof o.resetsAt === "string" ? o.resetsAt : null,
				...(o.tier === "premium" || o.tier === "free" ? { tier: o.tier } : {}),
				...(typeof o.model === "string" ? { model: o.model } : {}),
			};
		}
		case "done": {
			const o = (data ?? {}) as Partial<AgentDoneEvent>;
			return {
				type: "done",
				tokens: typeof o.tokens === "number" ? o.tokens : 0,
				...(typeof o.thinkingTokens === "number"
					? { thinkingTokens: o.thinkingTokens }
					: {}),
				...(typeof o.thinkingMs === "number"
					? { thinkingMs: o.thinkingMs }
					: {}),
			};
		}
		case "error": {
			const o = (data ?? {}) as Partial<AgentErrorEvent> & {
				message?: string;
			};
			return {
				type: "error",
				code: o.code ?? o.message ?? "stream_failed",
				...(typeof o.cap === "number" ? { cap: o.cap } : {}),
				...(typeof o.model === "string" ? { model: o.model } : {}),
			};
		}
		default:
			return null;
	}
}
