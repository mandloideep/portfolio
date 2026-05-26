import {
	type AgentTurn,
	useAgentSession,
} from "#/components/agent/agent-engine-provider";
import {
	AnswerStream,
	AnswerStreamStatic,
} from "#/components/agent/answer-stream";
import {
	pickVariant,
	RateLimitNotice,
} from "#/components/agent/rate-limit-notice";
import {
	ThinkingPeek,
	ThinkingPeekStatic,
} from "#/components/agent/thinking-peek";
import { cn } from "#/lib/utils";
import { ChatInputPill } from "./chat-input-pill";

/**
 * Thread variant of the chat surface — bubble list + composer pinned to
 * the bottom. Rendered once at least one turn exists; before that the
 * <ChatHero> variant renders instead.
 */
export function ChatThread() {
	const { state } = useAgentSession();
	return (
		<section data-testid="chat-thread" className="flex flex-1 flex-col">
			<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
				{state.history.map((turn, i) => (
					<ChatBubble
						key={turn.id}
						turn={turn}
						isActive={turn.id === state.activeTurnId}
						isLast={i === state.history.length - 1}
					/>
				))}
			</div>
			<div className="sticky bottom-0 border-t border-border/70 bg-bg-elev/80 px-6 py-3 backdrop-blur-sm">
				<ChatInputPill placeholder="Reply…" />
			</div>
		</section>
	);
}

type ChatBubbleProps = {
	turn: AgentTurn;
	isActive: boolean;
	isLast: boolean;
};

function ChatBubble({ turn, isActive, isLast }: ChatBubbleProps) {
	const session = useAgentSession();
	if (turn.role === "user") {
		return (
			<div className="max-w-[80%] self-end rounded-card border border-accent/30 bg-accent/10 px-3 py-2 text-fg">
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
				"max-w-[92%] self-start rounded-card border border-border bg-bg-elev px-4 py-3",
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

// Re-export for callsites that previously imported from the surface module.
export { pickVariant };
