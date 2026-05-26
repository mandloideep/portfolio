import { Link, useRouterState } from "@tanstack/react-router";
import { BorderBeam } from "#/components/ui/border-beam";
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
 * square brackets; the active tab gets a green border + soft glow via
 * `shadow-tab-active`. Active state is derived from the current router
 * pathname.
 */
export function TopTabs({ items, className }: TopTabsProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<nav
			aria-label="Page sections"
			data-testid="top-tabs"
			className={cn(
				"hidden items-center gap-2 overflow-x-auto px-4 py-2.5 sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
							"relative shrink-0 isolate overflow-hidden rounded-card border px-3.5 py-1.5 font-mono text-base transition-colors duration-base",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
							isActive
								? "border-accent/70 bg-accent/10 text-accent shadow-tab-active"
								: "border-border/70 bg-bg/40 text-muted hover:border-border hover:text-fg/90",
						)}
					>
						{isActive ? <BorderBeam duration={5} /> : null}
						<span className="relative z-10">[{item.label}]</span>
					</Link>
				);
			})}
		</nav>
	);
}
