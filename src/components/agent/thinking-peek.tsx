/**
 * <ThinkingPeek> — collapsing reasoning trace. ≤ 6 lines while streaming
 * with a soft fade-clip; auto-collapses to a one-line summary the moment
 * the first answer token arrives.
 *
 * Live thinking is rendered from the provider's stream emitter via
 * `useSyncExternalStore`, so a 200-token reasoning burst doesn't re-render
 * the rest of the chat — only this leaf paints.
 *
 * Aesthetic: dimmed muted text, monospace, pulsing accent dot while live, a
 * chevron in front. Tokens only.
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
				"group rounded-card border border-border/60 bg-bg/30 px-3 py-2 text-muted",
				className,
			)}
		>
			<summary className="flex cursor-pointer select-none list-none items-center gap-2 text-meta uppercase tracking-tab text-muted/80 [&::-webkit-details-marker]:hidden">
				<span
					aria-hidden="true"
					className={cn(
						"inline-block size-1.5 rounded-full",
						isStreaming ? "animate-pulse bg-accent" : "bg-muted/40",
					)}
				/>
				<span className="inline-block transition-transform group-open:rotate-90">
					▸
				</span>
				<span>{isStreaming ? "thinking…" : "thought"}</span>
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
	const caption = formatThoughtCaption(turn.thinkingMs, turn.thinkingTokens);
	if (!caption) return null;
	return (
		<span className="ml-auto text-muted/60 normal-case tracking-normal">
			{caption}
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
	const caption = formatThoughtCaption(turn.thinkingMs, turn.thinkingTokens);
	return (
		<details
			data-testid="thinking-peek-static"
			className={cn(
				"group rounded-card border border-border/60 bg-bg/30 px-3 py-2 text-muted",
				className,
			)}
		>
			<summary className="flex cursor-pointer select-none list-none items-center gap-2 text-meta uppercase tracking-tab text-muted/80 [&::-webkit-details-marker]:hidden">
				<span
					aria-hidden="true"
					className="inline-block size-1.5 rounded-full bg-muted/40"
				/>
				<span className="inline-block transition-transform group-open:rotate-90">
					▸
				</span>
				<span>thought</span>
				{caption ? (
					<span className="ml-auto text-muted/60 normal-case tracking-normal">
						{caption}
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
				"mt-2 whitespace-pre-wrap border-l-2 border-border/60 pl-3 text-sm italic leading-relaxed text-muted/90",
				clip ? "relative max-h-32 overflow-hidden" : "max-h-64 overflow-y-auto",
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

function formatThoughtCaption(
	ms: number | undefined,
	tokens: number | undefined,
): string | null {
	const parts: string[] = [];
	if (typeof ms === "number") {
		parts.push(ms >= 1000 ? `for ${(ms / 1000).toFixed(1)}s` : `for ${ms}ms`);
	}
	if (typeof tokens === "number") parts.push(`${tokens} tok`);
	if (parts.length === 0) return null;
	return `· ${parts.join(" · ")}`;
}
