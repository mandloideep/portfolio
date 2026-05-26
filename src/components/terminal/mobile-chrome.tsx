/**
 * <MobileChrome> — slim app-bar that replaces the macOS-style <Chrome> on
 * phones (< sm). Three regions:
 *
 *   ☰          deep ▸ <mode> ⌄          ⌘
 *   settings   mode picker               palette
 *
 * Settings opens the shared <SettingsSheet> with theme + density + model +
 * terminal-specific actions ("switch mode", "clear scrollback", "open chat",
 * "open portfolio"). Mode picker opens a bottom sheet to swap agent ↔ shell.
 * Palette opens the existing command palette dialog.
 */

import { useStore } from "@tanstack/react-store";
import {
	ChevronDown,
	Command as CommandIcon,
	MessageSquare,
	RotateCcw,
	Settings2,
	Sparkles,
	Terminal as TerminalIcon,
} from "lucide-react";
import { useState } from "react";
import { SettingsAction, SettingsSheet } from "#/components/ui/settings-sheet";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { cn } from "#/lib/utils";
import { clearBlocks, setMode, terminalStore } from "#/store/terminal";

type Props = {
	onOpenPalette: () => void;
};

export function MobileChrome({ onOpenPalette }: Props) {
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [modeOpen, setModeOpen] = useState(false);
	const mode = useStore(terminalStore, (s) => s.mode);

	return (
		<div
			data-testid="terminal-mobile-chrome"
			className="flex items-center gap-2 border-b border-border bg-bg-elev/95 px-3 py-2"
		>
			<button
				type="button"
				data-testid="mobile-chrome-settings"
				aria-label="open settings"
				onClick={() => setSettingsOpen(true)}
				className="inline-flex size-10 items-center justify-center rounded-card border border-border/70 bg-bg/40 text-fg transition-colors duration-base hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Settings2 className="size-4" aria-hidden="true" />
			</button>

			<button
				type="button"
				data-testid="mobile-chrome-mode"
				aria-label={`mode: ${mode}. tap to switch.`}
				onClick={() => setModeOpen(true)}
				className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-card border border-border/70 bg-bg/40 px-3 font-mono text-meta uppercase tracking-tab text-muted transition-colors duration-base hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<span className="text-prompt-user">deep</span>
				<span aria-hidden="true" className="text-muted/60">
					▸
				</span>
				<span className="text-fg/90">{mode}</span>
				<ChevronDown className="size-3 text-muted/70" aria-hidden="true" />
			</button>

			<button
				type="button"
				data-testid="mobile-chrome-palette"
				aria-label="open command palette"
				onClick={onOpenPalette}
				className="inline-flex size-10 items-center justify-center rounded-card border border-border/70 bg-bg/40 text-fg transition-colors duration-base hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<CommandIcon className="size-4" aria-hidden="true" />
			</button>

			<SettingsSheet
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
				showModel={mode === "agent"}
			>
				<SettingsAction
					icon={
						mode === "agent" ? (
							<TerminalIcon className="size-4" />
						) : (
							<Sparkles className="size-4" />
						)
					}
					label={mode === "agent" ? "switch to shell" : "switch to agent"}
					onClick={() => setMode(mode === "agent" ? "shell" : "agent")}
				/>
				<SettingsAction
					icon={<RotateCcw className="size-4" />}
					label="clear scrollback"
					onClick={() => clearBlocks()}
				/>
				<SettingsAction
					icon={<MessageSquare className="size-4" />}
					label="open chat"
					href="/chat"
				/>
			</SettingsSheet>

			<ModeSheet open={modeOpen} onOpenChange={setModeOpen} mode={mode} />
		</div>
	);
}

function ModeSheet({
	open,
	onOpenChange,
	mode,
}: {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	mode: "agent" | "shell";
}) {
	const options = [
		{
			id: "agent" as const,
			label: "agent",
			icon: <Sparkles className="size-5" />,
			blurb: "Free-form questions. Multi-line OK; press send.",
		},
		{
			id: "shell" as const,
			label: "shell",
			icon: <TerminalIcon className="size-5" />,
			blurb: "Slash commands. /me, /projects, /help, /exit.",
		},
	];

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="border-border bg-bg pb-6"
				data-testid="terminal-mode-sheet"
			>
				<SheetHeader>
					<SheetTitle className="font-mono text-meta uppercase tracking-tab text-fg">
						mode
					</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-2 px-4 pb-2">
					{options.map((opt) => {
						const active = opt.id === mode;
						return (
							<button
								key={opt.id}
								type="button"
								aria-pressed={active}
								onClick={() => {
									setMode(opt.id);
									onOpenChange(false);
								}}
								className={cn(
									"flex items-start gap-3 rounded-card border px-4 py-3 text-left transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									active
										? "border-accent/60 bg-accent/15 text-accent"
										: "border-border/60 bg-bg-elev/40 text-fg hover:border-accent/40 hover:bg-accent/10",
								)}
							>
								<span
									aria-hidden="true"
									className={cn("mt-0.5 shrink-0", active && "text-accent")}
								>
									{opt.icon}
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="font-mono text-base uppercase tracking-tab">
										{opt.label}
									</span>
									<span className="font-mono text-meta normal-case tracking-normal text-muted">
										{opt.blurb}
									</span>
								</span>
							</button>
						);
					})}
				</div>
			</SheetContent>
		</Sheet>
	);
}
