import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "#/lib/utils";

export interface TopTab {
	id: string;
	label: string;
	to: string;
}

export interface TopTabsProps {
	items: readonly TopTab[];
	className?: string;
}

/**
 * Terminal-style top tab strip. Each tab reads like a command name in
 * square brackets; the active tab gets a green border + soft glow. Active
 * state is derived from the current router pathname so the tabs work
 * across separate routes (no scroll-spy here).
 */
export function TopTabs({ items, className }: TopTabsProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<nav
			aria-label="Page sections"
			data-testid="top-tabs"
			className={cn(
				"flex items-center gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				className,
			)}
		>
			{items.map((item) => {
				const isActive =
					item.to === "/"
						? pathname === "/"
						: pathname === item.to || pathname.startsWith(`${item.to}/`);
				return (
					<Link
						key={item.id}
						to={item.to}
						data-testid={`top-tab-${item.id}`}
						data-active={isActive ? "true" : "false"}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							"shrink-0 rounded-md border px-3 py-1.5 font-mono text-[13px] transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
							isActive
								? "border-accent/70 bg-accent/10 text-accent shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_30%,transparent),0_0_18px_-2px_color-mix(in_oklch,var(--accent)_45%,transparent)]"
								: "border-border/70 bg-bg/40 text-muted hover:border-border hover:text-fg/90",
						)}
					>
						[{item.label}]
					</Link>
				);
			})}
		</nav>
	);
}
