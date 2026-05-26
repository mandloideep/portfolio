/**
 * <ChatThread> — conversation variant of the chat surface.
 *
 * Calm layout (no hero atmosphere): user messages right-aligned as soft
 * accent pills, assistant messages rendered as flush prose against the
 * page (no card wrapper) — mirroring Claude/Fastfolio chat. Sticky bottom
 * block houses a collapsible quick-prompt row + input pill + powered-by
 * meta line.
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
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
import { ChatAvatar } from "#/components/chat/chat-avatar";
import { ProjectMentionsRow } from "#/components/chat/project-mentions-row";
import { cn } from "#/lib/utils";
import { ChatInputPill } from "./chat-input-pill";
import { QuickPromptPills } from "./quick-prompts";

export function ChatThread() {
	const { state } = useAgentSession();
	const [showPrompts, setShowPrompts] = useState(true);
	return (
		<section data-testid="chat-thread" className="flex flex-1 flex-col">
			<div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6">
				{state.history.map((turn, i) => (
					<ChatBubble
						key={turn.id}
						turn={turn}
						isActive={turn.id === state.activeTurnId}
						isLast={i === state.history.length - 1}
					/>
				))}
			</div>
			<div className="sticky bottom-0 border-t border-border/60 bg-bg/80 px-4 pt-2 pb-3 backdrop-blur-md sm:px-6">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
					<button
						type="button"
						onClick={() => setShowPrompts((v) => !v)}
						data-testid="chat-toggle-prompts"
						className="mx-auto inline-flex items-center gap-1 font-mono text-meta uppercase tracking-tab text-muted/80 transition-colors hover:text-accent focus-visible:outline-none focus-visible:text-accent"
					>
						{showPrompts ? (
							<ChevronDown className="size-3" aria-hidden="true" />
						) : (
							<ChevronRight className="size-3" aria-hidden="true" />
						)}
						{showPrompts ? "hide quick questions" : "show quick questions"}
					</button>
					{showPrompts ? <QuickPromptPills /> : null}
					<ChatInputPill placeholder="Reply…" />
					<p className="text-center font-mono text-meta uppercase tracking-tab text-muted/60">
						powered by{" "}
						<a href="/terminal" className="text-link hover:text-accent">
							terminal mode
						</a>
					</p>
				</div>
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
			<div className="flex justify-end">
				<div className="max-w-[78%] rounded-2xl rounded-tr-md bg-accent/10 px-4 py-2.5 text-fg">
					<p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
						{turn.content}
					</p>
				</div>
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
		<div className="flex gap-3">
			<ChatAvatar
				size="sm"
				className="mt-1 hidden shrink-0 sm:inline-flex"
				ariaLabel="assistant"
			/>
			<div
				className={cn(
					"min-w-0 flex-1",
					isActive && status === "error" && "text-error",
				)}
			>
				{turn.thinking ? (
					<ThinkingPeekStatic className="mb-2" turn={turn} />
				) : isActive && showLiveThinking ? (
					<ThinkingPeek className="mb-2" />
				) : null}
				{showLive ? (
					<AnswerStream />
				) : (
					<AnswerStreamStatic text={turn.content} />
				)}
				{turn.content ? <ProjectMentionsRow turn={turn} /> : null}
				{isLast && isActive && turn.error ? (
					<RateLimitNotice
						className="mt-2"
						reason={turn.error}
						resetsAt={session.state.quota?.resetsAt ?? null}
					/>
				) : null}
			</div>
		</div>
	);
}

// Re-export for callsites that previously imported from the surface module.
export { pickVariant };
