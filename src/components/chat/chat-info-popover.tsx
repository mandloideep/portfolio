/**
 * <ChatInfoPopover> — Dialog opened from the header info chip.
 *
 * Hosts the chat's secondary settings: quota indicator, "new chat" action,
 * and a link back to terminal mode. The model switcher lives in the header
 * itself now (next to M/L/XL chips), so it's no longer duplicated here.
 *
 * Receives `open` / `onOpenChange` from `<ChatLayout>` so the trigger and
 * the dialog can share one piece of header chrome — keeps the header
 * symmetric and avoids a nested popover trigger.
 */

import { MessageSquarePlus, Terminal as TerminalIcon } from "lucide-react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { QuotaIndicator } from "#/components/agent/quota-indicator";
import { ChatAvatar } from "#/components/chat/chat-avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { siteMeta } from "#/content/site";

type Props = {
	open: boolean;
	onOpenChange: (next: boolean) => void;
};

export function ChatInfoPopover({ open, onOpenChange }: Props) {
	const { actions, state } = useAgentSession();
	const hasHistory = state.history.length > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-md sm:max-w-md"
				data-testid="chat-info-popover"
			>
				<div className="flex items-center gap-3">
					<ChatAvatar size="lg" />
					<div className="flex flex-col">
						<DialogTitle className="text-lg">{siteMeta.name}</DialogTitle>
						<DialogDescription className="text-sm text-fg/80">
							{siteMeta.role}
						</DialogDescription>
					</div>
				</div>

				<p className="font-mono text-meta uppercase tracking-tab text-muted">
					<span aria-hidden="true" className="text-prompt-user">
						${" "}
					</span>
					ask about projects, experience, skills, or just say hi
				</p>

				<div className="flex items-center justify-between gap-3 rounded-card border border-border/60 bg-bg/40 px-3 py-2 font-mono text-meta uppercase tracking-tab">
					<span className="text-muted">quota</span>
					<QuotaIndicator />
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{hasHistory ? (
						<button
							type="button"
							data-testid="chat-new"
							onClick={() => {
								actions.clear();
								onOpenChange(false);
							}}
							className="inline-flex items-center gap-1.5 rounded-pill border border-border/70 bg-bg-elev/60 px-3 py-1.5 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
						>
							<MessageSquarePlus className="size-3.5" aria-hidden="true" />
							new chat
						</button>
					) : null}
					<a
						href="/terminal"
						className="inline-flex items-center gap-1.5 rounded-pill border border-border/70 bg-bg-elev/60 px-3 py-1.5 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
					>
						<TerminalIcon className="size-3.5" aria-hidden="true" />
						terminal mode
					</a>
				</div>
			</DialogContent>
		</Dialog>
	);
}
