/**
 * <AgentEngineProvider> — the single source of truth for an agent session.
 *
 * Owns:
 *   • the active fetch / AbortController for the current stream
 *   • transient token + thinking buffers (refs, so per-token arrivals
 *     don't trigger top-level re-renders)
 *   • status transitions (idle → checking → thinking → answering → done)
 *   • completed turn history (state)
 *
 * Surfaces (`<TerminalAgentSurface>`, `<ChatAgentSurface>`, …) consume the
 * session via `useAgentSession()` which is `use(AgentContext)`. They never
 * touch the transport or stores directly — this keeps streaming logic in
 * one place and lets new surfaces compose primitives without forking it.
 *
 * Per `/vercel-react-best-practices`:
 *   • Per-token text accumulates in refs + a private emitter; leaf
 *     subscribers (AnswerStream, ThinkingPeek) use `useSyncExternalStore`.
 *   • Top-level state only flips on status transitions and final turn
 *     completion — so a 500-token reply causes ~5 top-level renders, not
 *     500.
 */

import { useStore } from "@tanstack/react-store";
import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	getAvailableModelsClient,
	getDefaultModelClient,
	getModel,
	type LlmModel,
} from "#/lib/agent/models";
import {
	type AgentHistoryEntry,
	type AgentStreamEvent,
	streamAgent,
} from "#/lib/agent/transport";
import { modelStore, setModel as setModelStore } from "#/store/model";
import { setQuota } from "#/store/quota";

export type AgentTurnRole = "user" | "assistant";

export type AgentTurn = {
	id: string;
	role: AgentTurnRole;
	content: string;
	thinking?: string;
	thinkingMs?: number;
	thinkingTokens?: number;
	tokens?: number;
	model?: string;
	createdAt: number;
	error?: string;
};

export type AgentStatus =
	| "idle"
	| "checking"
	| "thinking"
	| "answering"
	| "done"
	| "error";

export type AgentSession = {
	state: {
		status: AgentStatus;
		error: string | null;
		activeTurnId: string | null;
		history: AgentTurn[];
		/**
		 * Monotonic counter incremented each time a stream is aborted. The
		 * terminal binding watches this so the "^C aborted" system line
		 * fires reliably regardless of how React batches `status`
		 * transitions between `answering` and `idle`.
		 */
		abortNonce: number;
		/** Last known quota snapshot from the most recent stream. */
		quota: {
			remaining: number | null;
			limit: number | null;
			unlimited: boolean;
			tier: "free" | "premium";
			resetsAt: string | null;
		} | null;
		/** Most recent activity hint from the server. */
		activity: {
			step: "reading" | "calling" | "checking";
			text: string;
			model?: string;
			files?: string[];
		} | null;
	};
	actions: {
		send: (
			message: string,
			options?: {
				history?: import("#/lib/agent/transport").AgentHistoryEntry[];
			},
		) => Promise<void>;
		abort: () => boolean;
		setModel: (id: string) => boolean;
		clear: () => void;
	};
	meta: {
		availableModels: readonly LlmModel[];
		activeModel: LlmModel;
		isThinkingModel: boolean;
		tier: "free" | "premium";
	};
	/**
	 * Private subscription channel for leaf primitives that render
	 * high-frequency text. Top-level consumers should ignore this.
	 */
	streams: AgentStreamsHandle;
};

export type AgentActivityEntry = {
	id: string;
	step: "reading" | "calling" | "checking";
	text: string;
	model?: string;
	files?: string[];
	ts: number;
};

/** A pair of strings updating per-token + subscriber registration. */
export type AgentStreamsHandle = {
	getAnswer: () => string;
	getThinking: () => string;
	getActivities: () => readonly AgentActivityEntry[];
	/**
	 * The id of the turn the buffers currently belong to. Updated
	 * synchronously when a new send() starts (before any tokens arrive)
	 * so subscribers can compare against the block they last appended
	 * and start a fresh block on turn boundaries — even when the React
	 * state change to `state.activeTurnId` hasn't flushed yet.
	 */
	getCurrentTurnId: () => string | null;
	subscribeAnswer: (listener: () => void) => () => void;
	subscribeThinking: (listener: () => void) => () => void;
	subscribeActivities: (listener: () => void) => () => void;
};

export const AgentContext = createContext<AgentSession | null>(null);

export function useAgentSession(): AgentSession {
	const value = use(AgentContext);
	if (!value) {
		throw new Error(
			"useAgentSession() must be used inside <AgentEngineProvider>.",
		);
	}
	return value;
}

type StreamBuffers = {
	answer: string;
	thinking: string;
	activities: AgentActivityEntry[];
	currentTurnId: string | null;
	answerListeners: Set<() => void>;
	thinkingListeners: Set<() => void>;
	activityListeners: Set<() => void>;
};

function createBuffers(): StreamBuffers {
	return {
		answer: "",
		thinking: "",
		activities: [],
		currentTurnId: null,
		answerListeners: new Set(),
		thinkingListeners: new Set(),
		activityListeners: new Set(),
	};
}

function makeStreamsHandle(buffersRef: {
	current: StreamBuffers;
}): AgentStreamsHandle {
	return {
		getAnswer: () => buffersRef.current.answer,
		getThinking: () => buffersRef.current.thinking,
		getActivities: () => buffersRef.current.activities,
		getCurrentTurnId: () => buffersRef.current.currentTurnId,
		subscribeAnswer: (listener) => {
			buffersRef.current.answerListeners.add(listener);
			return () => {
				buffersRef.current.answerListeners.delete(listener);
			};
		},
		subscribeThinking: (listener) => {
			buffersRef.current.thinkingListeners.add(listener);
			return () => {
				buffersRef.current.thinkingListeners.delete(listener);
			};
		},
		subscribeActivities: (listener) => {
			buffersRef.current.activityListeners.add(listener);
			return () => {
				buffersRef.current.activityListeners.delete(listener);
			};
		},
	};
}

function notify(listeners: Set<() => void>): void {
	for (const l of listeners) l();
}

function newTurnId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function historyFromTurns(turns: AgentTurn[]): AgentHistoryEntry[] {
	const out: AgentHistoryEntry[] = [];
	for (const t of turns) {
		if (t.role === "user" && t.content.length > 0) {
			out.push({ role: "user", content: t.content });
		} else if (t.role === "assistant" && t.content.length > 0) {
			out.push({ role: "assistant", content: t.content });
		}
	}
	return out.slice(-10);
}

export function AgentEngineProvider({ children }: { children: ReactNode }) {
	const activeModelId = useStore(modelStore, (s) => s.activeModel);
	const availableModels = useMemo(() => getAvailableModelsClient(), []);
	const activeModel = useMemo<LlmModel>(() => {
		return (
			getModel(activeModelId) ?? availableModels[0] ?? getDefaultModelClient()
		);
	}, [activeModelId, availableModels]);

	const [status, setStatus] = useState<AgentStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
	const [abortNonce, setAbortNonce] = useState(0);
	const [history, setHistory] = useState<AgentTurn[]>([]);
	const [quota, setQuotaState] = useState<AgentSession["state"]["quota"]>(null);
	const [activity, setActivity] =
		useState<AgentSession["state"]["activity"]>(null);

	const buffersRef = useRef<StreamBuffers>(createBuffers());
	const abortRef = useRef<AbortController | null>(null);
	const streamsHandle = useMemo(() => makeStreamsHandle(buffersRef), []);

	const abort = useCallback((): boolean => {
		const controller = abortRef.current;
		if (!controller) return false;
		controller.abort();
		abortRef.current = null;
		return true;
	}, []);

	const clear = useCallback(() => {
		abort();
		buffersRef.current.answer = "";
		buffersRef.current.thinking = "";
		notify(buffersRef.current.answerListeners);
		notify(buffersRef.current.thinkingListeners);
		setHistory([]);
		setStatus("idle");
		setError(null);
		setActiveTurnId(null);
		setActivity(null);
	}, [abort]);

	const setModel = useCallback((id: string): boolean => {
		return setModelStore(id);
	}, []);

	const send = useCallback(
		async (message: string, options?: { history?: AgentHistoryEntry[] }) => {
			if (!message.trim()) return;
			// One stream at a time.
			if (abortRef.current) {
				abortRef.current.abort();
				abortRef.current = null;
			}
			const controller = new AbortController();
			abortRef.current = controller;

			const userTurn: AgentTurn = {
				id: newTurnId(),
				role: "user",
				content: message,
				createdAt: Date.now(),
			};
			const assistantTurn: AgentTurn = {
				id: newTurnId(),
				role: "assistant",
				content: "",
				model: activeModel.id,
				createdAt: Date.now(),
			};
			setHistory((h) => [...h, userTurn, assistantTurn]);
			setActiveTurnId(assistantTurn.id);
			setStatus("checking");
			setError(null);
			setActivity(null);

			// Reset buffers + currentTurnId synchronously so subscribers
			// observing the next token notice the turn boundary, even if
			// React hasn't flushed the `state.activeTurnId` update yet.
			buffersRef.current.answer = "";
			buffersRef.current.thinking = "";
			buffersRef.current.activities = [];
			buffersRef.current.currentTurnId = assistantTurn.id;
			notify(buffersRef.current.answerListeners);
			notify(buffersRef.current.thinkingListeners);
			notify(buffersRef.current.activityListeners);

			// History fed to the API excludes the just-appended pair. Surfaces
			// (terminal binding, chat surface) can override by passing options.history;
			// otherwise we use the engine's internal turn history.
			const apiHistory = options?.history ?? historyFromTurns(history);

			try {
				const iter = streamAgent({
					message,
					history: apiHistory,
					model: activeModel.id,
					signal: controller.signal,
				});

				let finishedTokens = 0;
				let finishedThinkingTokens = 0;
				let finishedThinkingMs: number | undefined;
				let finishedError: string | null = null;

				for await (const ev of iter) {
					applyEvent(ev);
					if (ev.type === "done") {
						finishedTokens = ev.tokens;
						finishedThinkingTokens = ev.thinkingTokens ?? 0;
						finishedThinkingMs = ev.thinkingMs;
					}
					if (ev.type === "error") {
						finishedError = ev.code;
					}
				}

				// Commit the final assistant turn to history with the buffered
				// content. Top-level renders once per turn, not once per token.
				const finalAnswer = buffersRef.current.answer;
				const finalThinking = buffersRef.current.thinking;
				const wasAborted = controller.signal.aborted;
				setHistory((h) =>
					h.map((t) =>
						t.id === assistantTurn.id
							? {
									...t,
									content: finalAnswer,
									...(finalThinking ? { thinking: finalThinking } : {}),
									...(typeof finishedThinkingMs === "number"
										? { thinkingMs: finishedThinkingMs }
										: {}),
									...(finishedThinkingTokens > 0
										? { thinkingTokens: finishedThinkingTokens }
										: {}),
									tokens: finishedTokens,
									...(finishedError ? { error: finishedError } : {}),
								}
							: t,
					),
				);
				if (wasAborted) {
					// Transport returns normally on abort (reader cancellation).
					// Bump the abort nonce so the terminal binding fires its
					// "^C aborted" system line; the engine flips status to idle
					// in the same batch.
					setAbortNonce((n) => n + 1);
					setStatus("idle");
				} else if (finishedError) {
					setStatus("error");
					setError(finishedError);
				} else {
					setStatus("done");
				}
			} catch (err) {
				if (controller.signal.aborted) {
					// Roll back to "idle" but keep whatever streamed so far in
					// the assistant turn.
					const finalAnswer = buffersRef.current.answer;
					setHistory((h) =>
						h.map((t) =>
							t.id === assistantTurn.id ? { ...t, content: finalAnswer } : t,
						),
					);
					setAbortNonce((n) => n + 1);
					setStatus("idle");
				} else {
					setStatus("error");
					setError(err instanceof Error ? err.message : "stream_failed");
				}
			} finally {
				if (abortRef.current === controller) abortRef.current = null;
			}

			function applyEvent(ev: AgentStreamEvent): void {
				switch (ev.type) {
					case "activity": {
						let text = "checking…";
						if (ev.step === "reading") {
							text =
								ev.files && ev.files.length > 0
									? `reading ${ev.files.join(", ")}`
									: "reading context";
						} else if (ev.step === "calling") {
							text = ev.model ? `calling ${ev.model}` : "calling model";
						} else if (ev.step === "checking") {
							text = ev.note ?? "checking prompt…";
						}
						const entry: AgentActivityEntry = {
							id: newTurnId(),
							step: ev.step,
							text,
							ts: Date.now(),
							...(ev.model ? { model: ev.model } : {}),
							...(ev.files ? { files: ev.files } : {}),
						};
						buffersRef.current.activities = [
							...buffersRef.current.activities,
							entry,
						];
						notify(buffersRef.current.activityListeners);
						setActivity({
							step: ev.step,
							text,
							...(ev.model ? { model: ev.model } : {}),
							...(ev.files ? { files: ev.files } : {}),
						});
						if (ev.step === "checking") setStatus("checking");
						break;
					}
					case "quota": {
						setQuotaState({
							remaining: ev.remaining,
							limit: ev.limit,
							unlimited: ev.unlimited,
							tier: ev.tier,
							resetsAt: ev.resetsAt,
						});
						setQuota({
							remaining: ev.remaining,
							unlimited: ev.unlimited,
							tier: ev.tier,
							limit: ev.limit ?? 0,
							resetsAt: ev.resetsAt,
						});
						break;
					}
					case "rate_limited": {
						setQuotaState({
							remaining: ev.remaining,
							limit: null,
							unlimited: false,
							tier: ev.tier ?? "free",
							resetsAt: ev.resetsAt,
						});
						setQuota({
							remaining: ev.remaining ?? 0,
							unlimited: false,
							tier: ev.tier ?? "free",
							resetsAt: ev.resetsAt,
						});
						setError(ev.reason);
						setStatus("error");
						break;
					}
					case "thinking": {
						buffersRef.current.thinking += ev.text;
						notify(buffersRef.current.thinkingListeners);
						setStatus((s) => (s === "answering" ? s : "thinking"));
						break;
					}
					case "token": {
						buffersRef.current.answer += ev.text;
						notify(buffersRef.current.answerListeners);
						setStatus((s) => (s === "answering" ? s : "answering"));
						break;
					}
					case "done":
						break;
					case "error": {
						setError(ev.code);
						setStatus("error");
						break;
					}
				}
			}
		},
		[activeModel, history],
	);

	// Abort any in-flight stream on unmount.
	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			abortRef.current = null;
		};
	}, []);

	const tier: "free" | "premium" = activeModel.tier;

	const value = useMemo<AgentSession>(
		() => ({
			state: {
				status,
				error,
				activeTurnId,
				abortNonce,
				history,
				quota,
				activity,
			},
			actions: { send, abort, setModel, clear },
			meta: {
				availableModels,
				activeModel,
				isThinkingModel: activeModel.thinking,
				tier,
			},
			streams: streamsHandle,
		}),
		[
			status,
			error,
			activeTurnId,
			abortNonce,
			history,
			quota,
			activity,
			send,
			abort,
			setModel,
			clear,
			availableModels,
			activeModel,
			tier,
			streamsHandle,
		],
	);

	return (
		<AgentContext.Provider value={value}>{children}</AgentContext.Provider>
	);
}
