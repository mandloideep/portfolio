/**
 * <ChatAgentSurface> — minimal bubble-thread surface composed over the same
 * <AgentEngineProvider> the terminal uses. The point of shipping it
 * alongside the engine extraction is to *prove* the engine is surface-
 * agnostic. Aesthetic direction is deferred to a follow-up; this scaffold
 * leans on the existing tokens and stays visually neutral so the chosen
 * contrasting direction lands cleanly.
 *
 * Mounted by `/chat` (gated to `?preview=1`).
 */

import { useRef } from "react";
import {
	type AgentTurn,
	useAgentSession,
} from "#/components/agent/agent-engine-provider";
import {
	AnswerStream,
	AnswerStreamStatic,
} from "#/components/agent/answer-stream";
import { ModelSwitcher } from "#/components/agent/model-switcher";
import { QuotaIndicator } from "#/components/agent/quota-indicator";
import {
	pickVariant,
	RateLimitNotice,
} from "#/components/agent/rate-limit-notice";
import {
	ThinkingPeek,
	ThinkingPeekStatic,
} from "#/components/agent/thinking-peek";
import { cn } from "#/lib/utils";

export function ChatAgentSurface() {
	const { state, meta } = useAgentSession();
	return (
		<div className="surface-grain min-h-screen bg-bg text-fg">
			<div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
				<ChatHeader />
				<main
					data-testid="chat-thread"
					className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
				>
					{state.history.length === 0 ? (
						<EmptyState modelLabel={meta.activeModel.label} />
					) : (
						state.history.map((turn, i) => (
							<ChatBubble
								key={turn.id}
								turn={turn}
								isActive={turn.id === state.activeTurnId}
								// Hide the active assistant's static content; the
								// live components paint instead.
								isLast={i === state.history.length - 1}
							/>
						))
					)}
				</main>
				<ChatComposer />
			</div>
		</div>
	);
}

function ChatHeader() {
	return (
		<header className="flex items-center justify-between gap-3 border-b border-border bg-bg-elev/95 px-6 py-3 font-mono text-meta uppercase tracking-tab text-muted">
			<div className="flex items-center gap-3">
				<span className="rounded-chip border border-border/70 bg-bg/60 px-2 py-0.5 text-fg/90">
					chat · preview
				</span>
			</div>
			<div className="flex items-center gap-3">
				<ModelSwitcher variant="header" />
				<QuotaIndicator />
			</div>
		</header>
	);
}

function EmptyState({ modelLabel }: { modelLabel: string }) {
	return (
		<div
			data-testid="chat-empty"
			className="m-auto max-w-md text-center text-muted"
		>
			<p className="font-mono text-meta uppercase tracking-tab">
				ask {modelLabel}
			</p>
			<p className="mt-2 text-sm">
				This preview shares the same engine as the terminal — your model choice,
				quota, and thinking trace carry across surfaces.
			</p>
		</div>
	);
}

function ChatBubble({
	turn,
	isActive,
	isLast,
}: {
	turn: AgentTurn;
	isActive: boolean;
	isLast: boolean;
}) {
	const session = useAgentSession();
	if (turn.role === "user") {
		return (
			<div className="self-end max-w-[80%] rounded-card border border-accent/30 bg-accent/10 px-3 py-2 text-fg">
				<p className="whitespace-pre-wrap break-words text-sm">
					{turn.content}
				</p>
			</div>
		);
	}
	const status = session.state.status;
	const showLive =
		isActive && (status === "thinking" || status === "answering");
	const showLiveThinking =
		isActive &&
		(status === "thinking" || status === "answering" || status === "done");
	return (
		<div
			className={cn(
				"self-start max-w-[92%] rounded-card border border-border bg-bg-elev px-4 py-3",
				isActive && status === "error" && "border-error/60",
			)}
		>
			{turn.thinking ? (
				<ThinkingPeekStatic className="mb-2" turn={turn} />
			) : isActive && showLiveThinking ? (
				<ThinkingPeek className="mb-2" />
			) : null}
			{showLive ? <AnswerStream /> : <AnswerStreamStatic text={turn.content} />}
			{isLast && isActive && turn.error ? (
				<RateLimitNotice
					className="mt-2"
					reason={turn.error}
					resetsAt={session.state.quota?.resetsAt ?? null}
				/>
			) : null}
		</div>
	);
}

function ChatComposer() {
	const { actions, state } = useAgentSession();
	const taRef = useRef<HTMLTextAreaElement | null>(null);
	const isStreaming =
		state.status === "checking" ||
		state.status === "thinking" ||
		state.status === "answering";

	return (
		<form
			data-testid="chat-composer"
			className="flex items-end gap-2 border-t border-border bg-bg-elev/95 px-6 py-3"
			onSubmit={(e) => {
				e.preventDefault();
				const value = taRef.current?.value.trim() ?? "";
				if (!value) return;
				if (taRef.current) taRef.current.value = "";
				void actions.send(value);
			}}
		>
			<textarea
				ref={taRef}
				rows={2}
				placeholder="ask Deep something…"
				className="flex-1 resize-none rounded-card border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
					}
				}}
			/>
			{isStreaming ? (
				<button
					type="button"
					onClick={() => actions.abort()}
					className="rounded-card border border-border px-3 py-2 font-mono text-meta uppercase tracking-tab text-muted hover:border-error hover:text-error"
				>
					stop
				</button>
			) : (
				<button
					type="submit"
					className="rounded-card border border-accent bg-accent/10 px-3 py-2 font-mono text-meta uppercase tracking-tab text-accent hover:bg-accent/20"
				>
					send
				</button>
			)}
		</form>
	);
}

// Surface re-export of pickVariant so future ShowcaseSlot work can plug in
// without poking through internals. (Currently unused by the scaffold.)
export { pickVariant };
