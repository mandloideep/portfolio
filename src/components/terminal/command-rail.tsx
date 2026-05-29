/**
 * <CommandRail> — touch-first command discovery row, visible only below the
 * `sm` breakpoint. Sits between the scrollback and the prompt, sticky just
 * above the prompt. Five thumb-reachable affordances:
 *
 *   /commands   ↑ prev   ↓ next   ⌘ palette   ⌫ clear
 *
 * The slash chip opens a bottom sheet listing every command from
 * `src/lib/terminal/commands`, grouped by category. Replaces the older
 * `<MobileQuickChips>` four-button list.
 */

import {
	ArrowDown,
	ArrowUp,
	Command as CommandIcon,
	Eraser,
	Slash,
} from "lucide-react";
import { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { commands as allCommands, type Command } from "#/lib/terminal/commands";
import { cn } from "#/lib/utils";
import { clearBlocks } from "#/store/terminal";
import { useSubmit } from "./use-submit";

type Props = {
	onOpenPalette: () => void;
	onFocusPrompt: () => void;
};

export function CommandRail({ onOpenPalette, onFocusPrompt }: Props) {
	const [slashOpen, setSlashOpen] = useState(false);
	const submit = useSubmit();

	function stepHistory(direction: -1 | 1) {
		document.dispatchEvent(
			new CustomEvent("terminal:history-step", { detail: { direction } }),
		);
		onFocusPrompt();
	}

	return (
		<div
			data-testid="command-rail"
			className="flex items-center gap-2 overflow-x-auto border-t border-border bg-bg-elev/70 px-3 py-2 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<RailButton
				icon={<Slash className="size-4" aria-hidden="true" />}
				label="commands"
				onClick={() => setSlashOpen(true)}
				testId="rail-commands"
				primary
			/>
			<RailButton
				icon={<ArrowUp className="size-4" aria-hidden="true" />}
				label="prev"
				onClick={() => stepHistory(-1)}
				testId="rail-history-prev"
			/>
			<RailButton
				icon={<ArrowDown className="size-4" aria-hidden="true" />}
				label="next"
				onClick={() => stepHistory(1)}
				testId="rail-history-next"
			/>
			<RailButton
				icon={<CommandIcon className="size-4" aria-hidden="true" />}
				label="palette"
				onClick={onOpenPalette}
				testId="rail-palette"
			/>
			<RailButton
				icon={<Eraser className="size-4" aria-hidden="true" />}
				label="clear"
				onClick={() => clearBlocks()}
				testId="rail-clear"
			/>

			<SlashDrawer
				open={slashOpen}
				onOpenChange={setSlashOpen}
				onPick={(cmd) => {
					setSlashOpen(false);
					void submit(cmd.name);
				}}
			/>
		</div>
	);
}

function RailButton({
	icon,
	label,
	onClick,
	testId,
	primary,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	testId: string;
	primary?: boolean;
}) {
	return (
		<button
			type="button"
			data-testid={testId}
			aria-label={label}
			onClick={onClick}
			className={cn(
				"inline-flex h-10 shrink-0 items-center gap-1.5 rounded-card border px-3 font-mono text-meta uppercase tracking-tab transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				primary
					? "border-accent/60 bg-accent/10 text-accent hover:bg-accent/20"
					: "border-border/70 bg-bg/40 text-muted hover:bg-accent/10 hover:text-accent",
			)}
		>
			{icon}
			<span>{label}</span>
		</button>
	);
}

// ─── Slash drawer ───────────────────────────────────────────────────────

type Category = "navigation" | "info" | "agent" | "system";

const CATEGORY_LABEL: Record<Category, string> = {
	info: "info",
	navigation: "navigate",
	agent: "agent",
	system: "system",
};

const CATEGORY_ORDER: Category[] = ["info", "navigation", "agent", "system"];

function categorize(cmd: Command): Category {
	const n = cmd.name;
	if (n === "/me" || n === "/experience" || n === "/skills" || n === "/contact")
		return "info";
	if (n === "/projects" || n === "/ui" || n === "/github" || n === "/resume")
		return "navigation";
	if (
		n === "/presentation" ||
		n === "/model" ||
		n === "/retry" ||
		n === "/theme" ||
		n === "/stats"
	)
		return "agent";
	return "system";
}

function SlashDrawer({
	open,
	onOpenChange,
	onPick,
}: {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	onPick: (cmd: Command) => void;
}) {
	const visible = allCommands.filter((c) => !c.hidden);
	const grouped = CATEGORY_ORDER.map((cat) => ({
		category: cat,
		commands: visible.filter((c) => categorize(c) === cat),
	})).filter((g) => g.commands.length > 0);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="border-border bg-bg pb-6"
				data-testid="slash-drawer"
			>
				<SheetHeader>
					<SheetTitle className="font-mono text-meta uppercase tracking-tab text-fg">
						commands
					</SheetTitle>
					<SheetDescription className="font-mono text-meta text-muted">
						tap to run
					</SheetDescription>
				</SheetHeader>
				<div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-4 pb-2">
					{grouped.map(({ category, commands }) => (
						<section key={category} className="flex flex-col gap-1">
							<h3 className="font-mono text-meta uppercase tracking-tab text-muted/70">
								{CATEGORY_LABEL[category]}
							</h3>
							<ul className="flex flex-col">
								{commands.map((c) => (
									<li key={c.name}>
										<button
											type="button"
											data-testid={`slash-${c.name.replace(/^\//, "")}`}
											onClick={() => onPick(c)}
											className="flex w-full items-start gap-3 rounded-card px-3 py-3 text-left transition-colors duration-base hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											<span className="font-mono text-base text-accent">
												{c.name}
											</span>
											<span className="flex-1 font-mono text-meta text-muted">
												{c.description}
											</span>
										</button>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			</SheetContent>
		</Sheet>
	);
}
