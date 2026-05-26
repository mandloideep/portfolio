/**
 * <ModeSwitcher> — shared two-surface cross-mode jump control.
 *
 * Two variants (composition-patterns: patterns-explicit-variants):
 *
 *   <ModeSwitcher variant="pills" active="…" />
 *     - icon + label chips, sized to match the existing chrome buttons.
 *     - lives in the top nav strip (portfolio TopTabs right slot,
 *       terminal + chat desktop headers).
 *     - renders the **two inactive** modes only.
 *     - label collapses to icon-only under sm so the chip stays compact.
 *
 *   <ModeSwitcher variant="sheet" active="…" />
 *     - vertical list of <SettingsAction> rows for the mobile settings
 *       drawers in portfolio / chat / terminal.
 *
 * The same `MODES` array drives both — adding a fourth surface later
 * means one edit here, not three sweeps across the codebase.
 */

import { LayoutGrid, MessageSquare, Terminal } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { ChromeButton } from "#/components/ui/chrome-button";
import { SettingsAction } from "#/components/ui/settings-sheet";
import { cn } from "#/lib/utils";

export type Mode = "ui" | "chat" | "terminal";

type ModeEntry = {
	id: Mode;
	href: string;
	label: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const MODES: ReadonlyArray<ModeEntry> = [
	{ id: "ui", href: "/", label: "/ui", icon: LayoutGrid },
	{ id: "chat", href: "/chat", label: "/chat", icon: MessageSquare },
	{ id: "terminal", href: "/terminal", label: "/terminal", icon: Terminal },
];

type Props = {
	active: Mode;
	variant: "pills" | "sheet";
	className?: string;
};

export function ModeSwitcher({ active, variant, className }: Props) {
	const others = MODES.filter((m) => m.id !== active);
	if (variant === "pills") {
		return (
			<div
				data-testid={`mode-switcher-pills-${active}`}
				className={cn("flex items-center gap-2", className)}
			>
				{others.map((m) => (
					<ModePill key={m.id} entry={m} />
				))}
			</div>
		);
	}
	return (
		<div
			data-testid={`mode-switcher-sheet-${active}`}
			className={cn("flex flex-col gap-2", className)}
		>
			{others.map((m) => (
				<SettingsAction
					key={m.id}
					icon={<m.icon className="size-4" />}
					label={`open ${m.id}`}
					href={m.href}
				/>
			))}
		</div>
	);
}

function ModePill({ entry }: { entry: ModeEntry }) {
	const Icon = entry.icon;
	return (
		<ChromeButton
			as="link"
			to={entry.href}
			size="sm"
			tone="muted"
			data-testid={`mode-switcher-${entry.id}`}
			aria-label={`open ${entry.id}`}
		>
			<Icon className="size-3" aria-hidden="true" />
			<span className="hidden sm:inline">{entry.label}</span>
		</ChromeButton>
	);
}
