/**
 * Terminal-facing facade over the headless `<AgentEngineProvider>`.
 *
 * Public shape stays `{ start, abort }` so existing callers (`use-submit.ts`,
 * `/retry` etc.) don't churn. Implementation now delegates to
 * `useAgentSession().actions` — the provider owns the stream, the buffers,
 * and the abort handle.
 *
 * Module-scoped `isAgentStreaming()` / `abortAgentStream()` read from a
 * lazily-populated ref that the provider mounts on first use, so non-React
 * call sites (`tour.ts`, the Ctrl+C handler in `prompt.tsx`) keep working
 * without prop drilling.
 */

import { useCallback } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import type { AgentHistoryEntry } from "#/lib/agent/transport";
import { terminalStore } from "#/store/terminal";

type EngineHandle = {
	status: () => string;
	abort: () => boolean;
};

let engineRef: EngineHandle | null = null;

export function registerEngineHandle(handle: EngineHandle): () => void {
	engineRef = handle;
	return () => {
		if (engineRef === handle) engineRef = null;
	};
}

export function isAgentStreaming(): boolean {
	if (!engineRef) return false;
	const s = engineRef.status();
	return s === "checking" || s === "thinking" || s === "answering";
}

export function abortAgentStream(): boolean {
	return engineRef?.abort() ?? false;
}

export type StreamHandle = {
	start: (message: string) => Promise<void>;
	abort: () => boolean;
};

export function useAgentStream(): StreamHandle {
	const { actions } = useAgentSession();
	const start = useCallback(
		async (message: string) => {
			// Derive recent history from terminal blocks (the legacy source
			// of truth in this surface) so back-compat tests + the existing
			// /retry flow keep working. The chat surface uses the engine's
			// internal history instead and doesn't pass `history`.
			const history = historyFromTerminalBlocks();
			await actions.send(message, { history });
		},
		[actions],
	);
	const abort = useCallback(() => actions.abort(), [actions]);
	return { start, abort };
}

function historyFromTerminalBlocks(): AgentHistoryEntry[] {
	const blocks = terminalStore.state.blocks;
	const out: AgentHistoryEntry[] = [];
	for (const b of blocks) {
		if (b.kind === "prompt" && b.mode === "agent") {
			// Two prompts in a row means the prior turn was aborted/failed
			// before any tokens streamed. Drop the orphan so the API sees
			// strict user/assistant alternation — chat templates that don't
			// alternate (Gemma especially) end up concatenating consecutive
			// user turns into a single mashed-together input.
			if (out[out.length - 1]?.role === "user") out.pop();
			out.push({ role: "user", content: b.text });
		} else if (b.kind === "markdown" && b.text.length > 0) {
			// Only count assistant text that follows a user turn —
			// otherwise it's content from a /me /projects style command.
			if (out[out.length - 1]?.role === "user") {
				out.push({ role: "assistant", content: b.text });
			}
		}
	}
	// Drop the just-appended prompt for the current submission (added by
	// `useSubmit` before this hook runs) and cap to the last 10 turns.
	if (out[out.length - 1]?.role === "user") out.pop();
	return out.slice(-10);
}
