/**
 * <ModelSwitcher> — compound model picker used by both the terminal status
 * footer and the chat header. Each subcomponent is a primitive a surface
 * can compose; the default export renders the common shape (trigger +
 * popover with Free / Premium groups).
 *
 * Source: built on Radix DropdownMenu (already vendored at
 * `src/components/ui/dropdown-menu.tsx`). Magic UI had no direct equivalent
 * for an upward-opening grouped menu, so we use shadcn primitives.
 *
 * Tokens-only: bg-bg-elev, text-fg, text-muted, text-accent, border-border.
 */

import { useStore } from "@tanstack/react-store";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { cn } from "#/lib/utils";
import { quotaStore } from "#/store/quota";

type Variant = "footer" | "header";

export function ModelSwitcher({
	variant = "footer",
	className,
}: {
	variant?: Variant;
	className?: string;
}) {
	const { meta, actions, state } = useAgentSession();
	const quota = useStore(quotaStore);
	const { availableModels, activeModel } = meta;
	const modelCounts = state.modelCounts;

	const free = useMemo(
		() => availableModels.filter((m) => m.tier === "free"),
		[availableModels],
	);
	const premium = useMemo(
		() => availableModels.filter((m) => m.tier === "premium"),
		[availableModels],
	);

	const premiumUsed =
		quota.tier === "premium" &&
		typeof quota.remaining === "number" &&
		quota.limit > 0
			? quota.limit - quota.remaining
			: null;
	const premiumExhausted =
		quota.tier === "premium" &&
		typeof quota.remaining === "number" &&
		quota.remaining <= 0;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					data-testid="model-switcher-trigger"
					aria-label={`active model: ${activeModel.label}. click to switch.`}
					className={cn(
						variant === "header"
							? "inline-flex h-8 items-center gap-1.5 truncate rounded-pill border border-border/70 bg-bg-elev/70 px-3 font-mono text-meta uppercase tracking-tab text-fg/90 shadow-sm transition-colors duration-base hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
							: "inline-flex items-center gap-1 truncate rounded-chip border border-border/70 bg-bg/60 px-1.5 py-0.5 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-fg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
						className,
					)}
				>
					<span className="text-muted/70">model/</span>
					<span className="truncate">{shortLabel(activeModel.label)}</span>
					<ChevronDownIcon className="size-3 shrink-0 text-muted/70" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side={variant === "footer" ? "top" : "bottom"}
				align="end"
				sideOffset={6}
				className="min-w-[18rem] border-border bg-bg-elev font-mono text-meta"
			>
				<DropdownMenuLabel className="text-muted/70 uppercase tracking-tab">
					free
				</DropdownMenuLabel>
				<DropdownMenuGroup>
					{free.map((m) => {
						const active = m.id === activeModel.id;
						const sent = modelCounts[m.id] ?? 0;
						return (
							<DropdownMenuItem
								key={m.id}
								onSelect={() => {
									actions.setModel(m.id);
								}}
								className="flex flex-col items-start gap-0.5 py-2"
							>
								<span className="flex w-full items-center gap-2">
									{active ? (
										<CheckIcon className="size-3 text-accent" />
									) : (
										<span className="size-3" aria-hidden="true" />
									)}
									<span className="text-fg/90">{m.label}</span>
									<span className="ml-auto flex items-center gap-2">
										{sent > 0 ? (
											<span className="text-muted/70 normal-case tracking-normal">
												{sent} sent
											</span>
										) : null}
										{m.thinking ? (
											<span className="text-accent-alt/80 text-meta">
												thinking
											</span>
										) : null}
									</span>
								</span>
								<span className="pl-5 text-muted/70 normal-case tracking-normal">
									{m.blurb}
								</span>
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuGroup>
				{premium.length > 0 ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="flex items-center justify-between text-muted/70 uppercase tracking-tab">
							<span>premium</span>
							{premiumUsed !== null ? (
								<span
									className={cn("text-fg/80", premiumExhausted && "text-error")}
								>
									{premiumUsed}/{quota.limit} today
								</span>
							) : null}
						</DropdownMenuLabel>
						<DropdownMenuGroup>
							{premium.map((m) => {
								const active = m.id === activeModel.id;
								const disabled = premiumExhausted && !active;
								const sent = modelCounts[m.id] ?? 0;
								return (
									<DropdownMenuItem
										key={m.id}
										disabled={disabled}
										onSelect={() => {
											if (disabled) return;
											actions.setModel(m.id);
										}}
										className="flex flex-col items-start gap-0.5 py-2"
									>
										<span className="flex w-full items-center gap-2">
											{active ? (
												<CheckIcon className="size-3 text-accent" />
											) : (
												<span className="size-3" aria-hidden="true" />
											)}
											<span className="text-fg/90">{m.label}</span>
											{sent > 0 ? (
												<span className="ml-auto text-muted/70 normal-case tracking-normal">
													{sent} sent
												</span>
											) : null}
										</span>
										<span className="pl-5 text-muted/70 normal-case tracking-normal">
											{disabled
												? `exhausted · resets ${humanizeReset(quota.resetsAt)}`
												: m.blurb}
										</span>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function shortLabel(label: string): string {
	// Trim the " · …" tail so the footer chip stays compact.
	const split = label.indexOf(" · ");
	return split === -1 ? label : label.slice(0, split).toLowerCase();
}

function humanizeReset(iso: string | null): string {
	if (!iso) return "soon";
	const ms = new Date(iso).getTime() - Date.now();
	if (!Number.isFinite(ms) || ms <= 0) return "soon";
	const hours = Math.floor(ms / 3_600_000);
	const minutes = Math.floor((ms % 3_600_000) / 60_000);
	if (hours >= 1) return `in ~${hours}h ${minutes}m`;
	return `in ~${minutes}m`;
}
