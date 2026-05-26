/**
 * <ChatLayout> — shared shell for the chat surface.
 *
 * Header reuses the same chrome primitives the portfolio + terminal use, so
 * a visitor's density (zoom) and theme choices carry across all three
 * surfaces.
 *
 * Desktop slot order:
 *   [brand]   [density M/L/XL]   [theme]   [model · name ⌄]   [ ⓘ ]
 *
 * Mobile (< sm):
 *   [brand]   [model badge]   [⚙ settings]
 *   ⚙ opens <SettingsSheet> with theme + density + model + actions.
 */

import {
	Info,
	MessageSquarePlus,
	Settings2,
	Terminal as TerminalIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { ModelSwitcher } from "#/components/agent/model-switcher";
import { ChatChip } from "#/components/chat/chat-chip";
import { ChatInfoPopover } from "#/components/chat/chat-info-popover";
import { DensityToggle } from "#/components/ui/density-toggle";
import { SettingsAction, SettingsSheet } from "#/components/ui/settings-sheet";
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
		<div
			className="surface-grain relative flex min-h-[100dvh] flex-col bg-bg text-fg"
			style={{ paddingTop: "env(safe-area-inset-top)" }}
		>
			<ChatHeader />
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
				{children}
			</div>
		</div>
	);
}

function ChatHeader() {
	const [infoOpen, setInfoOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const { actions, state } = useAgentSession();
	const hasHistory = state.history.length > 0;

	return (
		<header className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 sm:px-6">
			<ChatChip as="a" href="/?choose=1" data-testid="chat-brand-chip">
				<span aria-hidden="true" className="text-prompt-user">
					$
				</span>
				<span className="hidden sm:inline">{siteMeta.name.toLowerCase()}</span>
				<span className="sm:hidden">chat</span>
			</ChatChip>

			{/* Desktop controls */}
			<div className="hidden items-center gap-2 sm:flex">
				<DensityToggle />
				<ThemeSwitcher />
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

			{/* Mobile control */}
			<ChatChip
				onClick={() => setSettingsOpen(true)}
				aria-label="open settings"
				data-testid="chat-mobile-settings"
				className="px-2 sm:hidden"
			>
				<Settings2 className="size-4" aria-hidden="true" />
			</ChatChip>

			<ChatInfoPopover open={infoOpen} onOpenChange={setInfoOpen} />
			<SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen}>
				{hasHistory ? (
					<SettingsAction
						icon={<MessageSquarePlus className="size-4" />}
						label="new chat"
						onClick={() => actions.clear()}
					/>
				) : null}
				<SettingsAction
					icon={<TerminalIcon className="size-4" />}
					label="terminal mode"
					href="/terminal"
				/>
				<SettingsAction
					icon={<Info className="size-4" />}
					label="about"
					onClick={() => {
						setSettingsOpen(false);
						setInfoOpen(true);
					}}
				/>
			</SettingsSheet>
		</header>
	);
}
