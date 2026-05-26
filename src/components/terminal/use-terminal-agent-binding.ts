/**
 * `useTerminalAgentBinding()` — bridges the surface-agnostic
 * `<AgentEngineProvider>` to the terminal's block-stream UI.
 *
 * Mount once at the terminal route boundary. The hook:
 *   • Registers a module-scoped engine handle so `isAgentStreaming()` /
 *     `abortAgentStream()` (non-React call sites) keep working.
 *   • Subscribes to the engine's thinking + answer emitters and upserts
 *     the matching `thinking` / `markdown` blocks.
 *   • Watches activity / status / error transitions and emits activity
 *     and system lines that match the existing terminal feel.
 *
 * The binding owns no streaming state — it only translates engine
 * events into block operations. Cancelling streams, history mgmt, and
 * abort wiring live in the provider.
 */

import { useEffect, useRef } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { pickVariant } from "#/components/agent/rate-limit-notice";
import { makeBlock } from "#/lib/terminal/blocks";
import {
	appendBlock,
	emit,
	terminalStore,
	updateBlock,
} from "#/store/terminal";
import { registerEngineHandle } from "./use-agent-stream";

export function useTerminalAgentBinding(): void {
	const session = useAgentSession();
	const { state, streams, actions } = session;

	// Register the engine handle so `isAgentStreaming()` (used by Ctrl+C
	// in prompt.tsx and tour.ts) reads the current status without React.
	useEffect(() => {
		return registerEngineHandle({
			status: () => session.state.status,
			abort: () => actions.abort(),
		});
		// `actions.abort` is stable; reading status through the live session
		// reference avoids re-registering on every status flip.
		// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	}, [actions, session]);

	// Track which turn's blocks we've appended. Refs (not state) so per-token
	// fan-out doesn't trigger React state updates. Each ref carries the turn
	// id it was created for; new tokens for a different turn id make us
	// create a fresh block.
	const thinkingBlockRef = useRef<{ id: string; turnId: string } | null>(null);
	const answerBlockRef = useRef<{ id: string; turnId: string } | null>(null);

	// Activity → emit a block per activity event. Subscribing to the
	// activity emitter (not the latest-only `state.activity`) lets
	// rapid-fire events still emit one block each, instead of getting
	// collapsed by React state batching.
	const emittedActivityIdsRef = useRef<Set<string>>(new Set());
	useEffect(() => {
		const sweep = () => {
			const list = streams.getActivities();
			for (const entry of list) {
				if (emittedActivityIdsRef.current.has(entry.id)) continue;
				emittedActivityIdsRef.current.add(entry.id);
				emit("activity", `· ${entry.text}`);
			}
		};
		const unsub = streams.subscribeActivities(sweep);
		sweep();
		return unsub;
	}, [streams]);

	// Reset emitted-activity ids when a new turn starts. We *want* the
	// effect to re-run whenever activeTurnId flips — read it in the body
	// (assigned to a discard) so Biome's exhaustive-deps lint sees the
	// dependency as used.
	useEffect(() => {
		const _turnId = state.activeTurnId;
		void _turnId;
		emittedActivityIdsRef.current = new Set();
	}, [state.activeTurnId]);

	// Subscribe to the thinking emitter → upsert a `thinking` block.
	// Subscription is bound to the session; turn boundaries are
	// detected synchronously via `streams.getCurrentTurnId()`.
	useEffect(() => {
		let cancelled = false;
		const onChange = () => {
			if (cancelled) return;
			const text = streams.getThinking();
			if (!text) return;
			const turnId = streams.getCurrentTurnId();
			if (!turnId) return;
			const existing = thinkingBlockRef.current;
			if (existing && existing.turnId === turnId) {
				updateBlock(existing.id, { text });
			} else {
				const block = makeBlock("thinking", { text, collapsed: false });
				thinkingBlockRef.current = { id: block.id, turnId };
				appendBlock(block);
			}
		};
		const unsub = streams.subscribeThinking(onChange);
		return () => {
			cancelled = true;
			unsub();
		};
	}, [streams]);

	// Subscribe to the answer emitter → upsert the markdown block. The
	// first answer token also flips the matching turn's thinking block
	// to `collapsed`. Turn-id comparison happens against
	// `streams.getCurrentTurnId()` so we create a fresh block when a
	// new send() supersedes the previous turn — even before React
	// flushes the state update to `state.activeTurnId`.
	useEffect(() => {
		let cancelled = false;
		const collapsedTurns = new Set<string>();
		const onChange = () => {
			if (cancelled) return;
			const text = streams.getAnswer();
			if (!text) return;
			const turnId = streams.getCurrentTurnId();
			if (!turnId) return;
			const thinkingFor = thinkingBlockRef.current;
			if (
				thinkingFor &&
				thinkingFor.turnId === turnId &&
				!collapsedTurns.has(turnId)
			) {
				const thinking = streams.getThinking();
				updateBlock(thinkingFor.id, {
					text: thinking,
					collapsed: true,
				});
				collapsedTurns.add(turnId);
			}
			const existing = answerBlockRef.current;
			if (existing && existing.turnId === turnId) {
				updateBlock(existing.id, { text });
			} else {
				const block = makeBlock("markdown", { text });
				answerBlockRef.current = { id: block.id, turnId };
				appendBlock(block);
			}
		};
		const unsub = streams.subscribeAnswer(onChange);
		return () => {
			cancelled = true;
			unsub();
		};
	}, [streams]);

	// On final turn commit, fold tokens + thinking duration into the
	// thinking block's summary and emit the (N tokens) system line.
	const lastDoneTurnRef = useRef<string | null>(null);
	useEffect(() => {
		if (state.status !== "done" && state.status !== "error") return;
		const turnId = state.activeTurnId;
		if (!turnId || lastDoneTurnRef.current === turnId) return;
		lastDoneTurnRef.current = turnId;
		const turn = state.history.find((t) => t.id === turnId);
		if (!turn) return;
		const thinkingForTurn =
			thinkingBlockRef.current?.turnId === turnId
				? thinkingBlockRef.current
				: null;
		if (
			thinkingForTurn &&
			turn.thinking &&
			(typeof turn.thinkingMs === "number" ||
				typeof turn.thinkingTokens === "number")
		) {
			updateBlock(thinkingForTurn.id, {
				text: turn.thinking,
				collapsed: true,
				...(typeof turn.thinkingMs === "number"
					? { durationMs: turn.thinkingMs }
					: {}),
				...(typeof turn.thinkingTokens === "number"
					? { tokens: turn.thinkingTokens }
					: {}),
			});
		}
		if (
			state.status === "done" &&
			typeof turn.tokens === "number" &&
			turn.tokens > 0
		) {
			emit("system", `(${turn.tokens} tokens)`);
		}
		if (state.status === "error" && state.error) {
			const variant = pickVariant(state.error);
			if (variant === "generic") {
				emit("error", `agent: ${formatError(state.error)}`);
			} else {
				emit("error", `agent: ${formatRateLimited(state.error)}`);
			}
		}
	}, [state.status, state.activeTurnId, state.history, state.error]);

	// Detect ^C aborts via the engine's abortNonce monotonic counter.
	// Watching this directly (rather than inferring from `state.status`
	// transitions) is reliable across React's batching of `answering`→
	// `idle`, which can otherwise drop the intermediate streaming state
	// and miss the transition.
	const lastAbortNonceRef = useRef(state.abortNonce);
	useEffect(() => {
		if (state.abortNonce !== lastAbortNonceRef.current) {
			lastAbortNonceRef.current = state.abortNonce;
			emit("system", "^C aborted");
		}
	}, [state.abortNonce]);

	// Clear streaming buffers between turns so the next emitter dispatch
	// after a fresh `activeTurnId` sees fresh text. The provider already
	// resets these on send(); this guard handles the unmount → remount
	// case.
	useEffect(() => {
		return () => {
			// best-effort: leave block refs intact; terminalStore unmount
			// is what really resets the surface.
			void terminalStore;
		};
	}, []);
}

function formatError(code: string): string {
	switch (code) {
		case "prompt_too_long":
			return "prompts are capped — try a shorter question";
		case "off_topic":
			return "I only chat about Deep's portfolio. try /help or /projects";
		case "rejected":
			return "rejected";
		case "agent_unavailable":
			return "agent is unavailable right now — try the visual portfolio (/ui)";
		case "model_unavailable":
			return "that model isn't configured for this deploy — try a different one";
		default:
			return code;
	}
}

function formatRateLimited(reason: string): string {
	switch (reason) {
		case "cooldown":
			return "easy there — wait a moment before sending the next message";
		case "model_rpm":
			return "shared per-minute cap — switch model in the footer or retry shortly";
		case "model_rpd":
			return "model hit its shared daily cap — switch model or come back tomorrow (UTC midnight)";
		case "premium_exhausted":
			return "out of premium messages — switch to a free Gemma to keep chatting";
		case "ip_token_budget":
			return "you've used your daily token budget — try /ui";
		case "daily_budget":
			return "the agent's daily budget is spent for everyone today — try /ui";
		case "limit_reached":
			return "you've used your free messages for the day — try /ui";
		case "vpn":
		case "proxy":
		case "tor":
		case "hosting":
			return "agent disabled for VPN/datacenter IPs — try /ui";
		default:
			return reason;
	}
}
