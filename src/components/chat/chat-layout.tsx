/**
 * <ChatLayout> — shared shell for the chat surface.
 *
 * Header reads as four symmetric chips:
 *   [brand]   [M | L | XL]   [model · name ⌄]   [ ⓘ ]
 *
 * Left-aligned brand, right-aligned info, with model controls between them.
 * All chips share the <ChatChip> shape so the chrome reads symmetric.
 */

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ModelSwitcher } from "#/components/agent/model-switcher";
import { ChatChip } from "#/components/chat/chat-chip";
import { ChatInfoPopover } from "#/components/chat/chat-info-popover";
import { ModelTierChips } from "#/components/chat/model-tier-chips";
import { siteMeta } from "#/content/site";

type ChatLayoutProps = {
	children: ReactNode;
};

export function ChatLayout({ children }: ChatLayoutProps) {
	return (
		<div className="surface-grain relative flex min-h-screen flex-col bg-bg text-fg">
			<ChatHeader />
			<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
				{children}
			</div>
		</div>
	);
}

function ChatHeader() {
	const [infoOpen, setInfoOpen] = useState(false);
	return (
		<header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
			<ChatChip as="a" href="/?choose=1" data-testid="chat-brand-chip">
				<span aria-hidden="true" className="text-prompt-user">
					$
				</span>
				<span className="hidden sm:inline">{siteMeta.name.toLowerCase()}</span>
				<span className="sm:hidden">chat</span>
			</ChatChip>

			<div className="flex items-center gap-2">
				<div className="hidden sm:block">
					<ModelTierChips />
				</div>
				<ModelSwitcher variant="header" />
				<ChatChip
					onClick={() => setInfoOpen(true)}
					aria-label="about this chat"
					data-testid="chat-info-trigger"
					className="px-2"
				>
					<Info className="size-3.5" aria-hidden="true" />
				</ChatChip>
			</div>

			<ChatInfoPopover open={infoOpen} onOpenChange={setInfoOpen} />
		</header>
	);
}
