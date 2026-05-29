/**
 * <SettingsSheet> — one mobile drawer used by both the chat header and the
 * terminal chrome. Composes the existing theme + density + model primitives
 * as touch-friendly list rows so all three controls live behind a single
 * tap on phones.
 *
 * Surface-specific extras (new chat, switch mode, clear scrollback, etc.)
 * pass through `children` and should use <SettingsAction> for visual rhythm.
 */

import { useStore } from "@tanstack/react-store";
import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { useTheme } from "#/hooks/use-theme";
import { cn } from "#/lib/utils";
import {
	DENSITIES,
	type Density,
	densityStore,
	setDensity,
} from "#/store/density";
import { quotaStore } from "#/store/quota";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./sheet";

type Props = {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	/** Surface-specific extra actions, rendered above the close button. */
	children?: ReactNode;
	/** Whether to include the model picker. Terminal shell mode hides it. */
	showModel?: boolean;
};

export function SettingsSheet({
	open,
	onOpenChange,
	children,
	showModel = true,
}: Props) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="border-border bg-bg p-0 sm:max-w-sm"
				data-testid="settings-sheet"
			>
				<SheetHeader className="border-border/60 border-b px-5 py-4">
					<SheetTitle className="font-mono text-meta uppercase tracking-tab text-fg">
						settings
					</SheetTitle>
					<SheetDescription className="font-mono text-meta text-muted">
						theme, density, and model
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6">
					<DensitySection />
					<ThemeSection />
					{showModel ? <ModelSection /> : null}
					{children ? (
						<section className="flex flex-col gap-2">
							<SectionLabel>actions</SectionLabel>
							<div className="flex flex-col gap-2">{children}</div>
						</section>
					) : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function SectionLabel({ children }: { children: ReactNode }) {
	return (
		<h3 className="font-mono text-meta uppercase tracking-tab text-muted">
			{children}
		</h3>
	);
}

function DensitySection() {
	const current = useStore(densityStore, (s) => s.value);
	const label: Record<Density, string> = {
		compact: "S",
		cozy: "M",
		comfy: "L",
		roomy: "XL",
	};

	return (
		<section className="flex flex-col gap-2">
			<SectionLabel>density</SectionLabel>
			<div className="grid grid-cols-4 gap-1 rounded-card border border-border/60 bg-bg-elev/40 p-1">
				{DENSITIES.map((d) => {
					const active = d === current;
					return (
						<button
							key={d}
							type="button"
							aria-pressed={active}
							aria-label={`${d} density`}
							onClick={() => setDensity(d)}
							className={cn(
								"inline-flex h-10 items-center justify-center rounded-chip font-mono text-meta uppercase tracking-tab transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								active
									? "bg-accent/15 text-accent"
									: "text-muted hover:bg-accent/10 hover:text-accent",
							)}
						>
							{label[d]}
						</button>
					);
				})}
			</div>
		</section>
	);
}

function ThemeSection() {
	const { theme, setTheme, themes } = useTheme();
	return (
		<section className="flex flex-col gap-2">
			<SectionLabel>theme</SectionLabel>
			<ul className="flex flex-col gap-1 rounded-card border border-border/60 bg-bg-elev/40 p-1">
				{themes.map((t) => {
					const active = t.slug === theme;
					return (
						<li key={t.slug}>
							<button
								type="button"
								data-testid={`settings-theme-${t.slug}`}
								onClick={() => setTheme(t.slug)}
								className={cn(
									"flex w-full items-center gap-3 rounded-chip px-3 py-3 text-left transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									active
										? "bg-accent/15 text-accent"
										: "text-fg hover:bg-accent/10",
								)}
							>
								<span
									aria-hidden="true"
									className="inline-flex size-4 shrink-0 items-center justify-center text-accent"
								>
									{active ? <CheckIcon className="size-4" /> : null}
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="text-base text-fg">{t.name}</span>
									<span className="text-meta text-muted">{t.vibe}</span>
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function ModelSection() {
	const { meta, actions } = useAgentSession();
	const quota = useStore(quotaStore);
	const { availableModels, activeModel } = meta;

	const free = availableModels.filter((m) => m.tier === "free");
	const premium = availableModels.filter((m) => m.tier === "premium");

	const premiumExhausted =
		quota.tier === "premium" &&
		typeof quota.remaining === "number" &&
		quota.remaining <= 0;

	return (
		<section className="flex flex-col gap-2">
			<SectionLabel>model</SectionLabel>
			<div className="flex flex-col gap-2 rounded-card border border-border/60 bg-bg-elev/40 p-1">
				<ModelGroup label="free">
					{free.map((m) => (
						<ModelRow
							key={m.id}
							label={m.label}
							blurb={m.blurb}
							thinking={m.thinking}
							active={m.id === activeModel.id}
							disabled={false}
							onSelect={() => actions.setModel(m.id)}
						/>
					))}
				</ModelGroup>
				{premium.length > 0 ? (
					<ModelGroup label="premium">
						{premium.map((m) => {
							const active = m.id === activeModel.id;
							const disabled = premiumExhausted && !active;
							return (
								<ModelRow
									key={m.id}
									label={m.label}
									blurb={m.blurb}
									thinking={m.thinking}
									active={active}
									disabled={disabled}
									onSelect={() => {
										if (disabled) return;
										actions.setModel(m.id);
									}}
								/>
							);
						})}
					</ModelGroup>
				) : null}
			</div>
		</section>
	);
}

function ModelGroup({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="px-3 pt-2 font-mono text-meta uppercase tracking-tab text-muted/70">
				{label}
			</span>
			<ul className="flex flex-col">{children}</ul>
		</div>
	);
}

function ModelRow({
	label,
	blurb,
	thinking,
	active,
	disabled,
	onSelect,
}: {
	label: string;
	blurb: string;
	thinking?: boolean;
	active: boolean;
	disabled: boolean;
	onSelect: () => void;
}) {
	return (
		<li>
			<button
				type="button"
				onClick={onSelect}
				disabled={disabled}
				className={cn(
					"flex w-full items-start gap-3 rounded-chip px-3 py-3 text-left transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					active && "bg-accent/15",
					!active && !disabled && "hover:bg-accent/10",
					disabled && "cursor-not-allowed opacity-50",
				)}
			>
				<span
					aria-hidden="true"
					className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center text-accent"
				>
					{active ? <CheckIcon className="size-4" /> : null}
				</span>
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="flex items-center gap-2">
						<span className={cn("text-base", active ? "text-accent" : "text-fg")}>
							{label}
						</span>
						{thinking ? (
							<span className="font-mono text-meta text-accent-alt/80 uppercase tracking-tab">
								thinking
							</span>
						) : null}
					</span>
					<span className="text-meta text-muted">{blurb}</span>
				</span>
			</button>
		</li>
	);
}

/**
 * Visual rhythm for the surface-specific extras passed as children. Pass
 * an icon + label as children; pass `href` to render a link, otherwise it
 * acts as a button.
 */
export function SettingsAction({
	icon,
	label,
	onClick,
	href,
	destructive,
}: {
	icon: ReactNode;
	label: string;
	onClick?: () => void;
	href?: string;
	destructive?: boolean;
}) {
	const className = cn(
		"flex w-full items-center gap-3 rounded-card border border-border/60 bg-bg-elev/40 px-4 py-3 text-left font-mono text-meta uppercase tracking-tab text-fg transition-colors duration-base hover:border-accent/60 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		destructive && "hover:border-error hover:bg-error/10 hover:text-error",
	);
	const content = (
		<>
			<span aria-hidden="true" className="inline-flex size-4 shrink-0">
				{icon}
			</span>
			<span>{label}</span>
		</>
	);
	if (href) {
		return (
			<SheetClose asChild>
				<a href={href} className={className}>
					{content}
				</a>
			</SheetClose>
		);
	}
	return (
		<SheetClose asChild>
			<button type="button" onClick={onClick} className={className}>
				{content}
			</button>
		</SheetClose>
	);
}
