/**
 * <ThinkingPeek> — collapsing reasoning trace. ≤ 6 lines while streaming
 * with a soft fade-clip; auto-collapses to a one-line summary the moment
 * the first answer token arrives.
 *
 * Live thinking is rendered from the provider's stream emitter via
 * `useSyncExternalStore`, so a 200-token reasoning burst doesn't re-render
 * the rest of the chat — only this leaf paints.
 *
 * Aesthetic: dimmed italic muted text, monospace, a small ▾/▸ chevron in
 * front. No raw hex; tokens-only.
 */

import { useSyncExternalStore } from "react";
import {
	type AgentTurn,
	useAgentSession,
} from "#/components/agent/agent-engine-provider";
import { cn } from "#/lib/utils";

/**
 * Live variant: subscribes to the engine's thinking buffer and shows it
 * collapsed once the assistant starts answering.
 */
export function ThinkingPeek({ className }: { className?: string }) {
	const { state, streams } = useAgentSession();
	const thinking = useSyncExternalStore(
		streams.subscribeThinking,
		streams.getThinking,
		() => "",
	);

	const isStreaming = state.status === "thinking";
	const hasFinishedThinking =
		state.status === "answering" ||
		state.status === "done" ||
		state.status === "error";

	if (!thinking && state.status === "idle") return null;
	if (!thinking) return null;

	return (
		<details
			open={isStreaming}
			data-testid="thinking-peek"
			className={cn(
				"group rounded-card border border-border/60 bg-bg/30 px-3 py-2 text-muted/80 italic",
				className,
			)}
		>
			<summary className="cursor-pointer select-none list-none text-meta uppercase tracking-tab text-muted/70 [&::-webkit-details-marker]:hidden">
				<span className="mr-1.5 inline-block transition-transform group-open:rotate-90">
					▸
				</span>
				{isStreaming ? "thinking · streaming" : "thought"}
				{hasFinishedThinking && state.activeTurnId ? (
					<ThinkingSummary turnId={state.activeTurnId} />
				) : null}
			</summary>
			<ThinkingBody text={thinking} clip={isStreaming} />
		</details>
	);
}

function ThinkingSummary({ turnId }: { turnId: string }) {
	const session = useAgentSession();
	const turn = session.state.history.find((t) => t.id === turnId);
	if (!turn || !turn.thinking) return null;
	const ms = turn.thinkingMs;
	const tokens = turn.thinkingTokens;
	const parts: string[] = [];
	if (typeof ms === "number") parts.push(`${ms}ms`);
	if (typeof tokens === "number") parts.push(`${tokens} tokens`);
	if (parts.length === 0) return null;
	return (
		<span className="ml-2 text-muted/60 normal-case tracking-normal">
			· {parts.join(" · ")}
		</span>
	);
}

/**
 * Static variant: renders a completed turn's thinking trace (chat history,
 * re-render after refresh, etc.). Pass the turn — used by the chat surface.
 */
export function ThinkingPeekStatic({
	turn,
	className,
}: {
	turn: AgentTurn;
	className?: string;
}) {
	if (!turn.thinking) return null;
	const ms = turn.thinkingMs;
	const tokens = turn.thinkingTokens;
	const parts: string[] = [];
	if (typeof ms === "number") parts.push(`${ms}ms`);
	if (typeof tokens === "number") parts.push(`${tokens} tokens`);
	return (
		<details
			data-testid="thinking-peek-static"
			className={cn(
				"group rounded-card border border-border/60 bg-bg/30 px-3 py-2 text-muted/80 italic",
				className,
			)}
		>
			<summary className="cursor-pointer select-none list-none text-meta uppercase tracking-tab text-muted/70 [&::-webkit-details-marker]:hidden">
				<span className="mr-1.5 inline-block transition-transform group-open:rotate-90">
					▸
				</span>
				thought
				{parts.length > 0 ? (
					<span className="ml-2 text-muted/60 normal-case tracking-normal">
						· {parts.join(" · ")}
					</span>
				) : null}
			</summary>
			<ThinkingBody text={turn.thinking} clip={false} />
		</details>
	);
}

function ThinkingBody({ text, clip }: { text: string; clip: boolean }) {
	return (
		<div
			className={cn(
				"mt-2 whitespace-pre-wrap text-sm leading-relaxed",
				clip && "relative max-h-32 overflow-hidden",
			)}
		>
			{text}
			{clip ? (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg/95 to-transparent"
				/>
			) : null}
		</div>
	);
}
