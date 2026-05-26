/**
 * <ChatLayout> — shared shell for the chat surface.
 *
 * Header reuses the same chrome primitives the portfolio + terminal use, so
 * a visitor's density (zoom) and theme choices carry across all three
 * surfaces. Slot order:
 *
 *   [brand]   [density M/L/XL]   [theme]   [model · name ⌄]   [ ⓘ ]
 */

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ModelSwitcher } from "#/components/agent/model-switcher";
import { ChatChip } from "#/components/chat/chat-chip";
import { ChatInfoPopover } from "#/components/chat/chat-info-popover";
import { DensityToggle } from "#/components/ui/density-toggle";
import { ThemeSwitcher } from "#/components/ui/theme-switcher";
import { siteMeta } from "#/content/site";
import { useDensity } from "#/hooks/use-density";

type ChatLayoutProps = {
	children: ReactNode;
};

export function ChatLayout({ children }: ChatLayoutProps) {
	// Applies the active `data-density` attribute so density toggle steps
	// actually scale the chat UI (matches terminal-shell + portfolio-layout).
	useDensity();
	return (
		<div className="surface-grain relative flex min-h-screen flex-col bg-bg text-fg">
			<ChatHeader />
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
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
				<div className="hidden sm:inline-flex">
					<DensityToggle />
				</div>
				<div className="hidden sm:inline-flex">
					<ThemeSwitcher />
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
