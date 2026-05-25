import { useScrollSpy } from "#/hooks/use-scroll-spy";
import { cn } from "#/lib/utils";

export interface TopTab {
	id: string;
	label: string;
}

export interface TopTabsProps {
	items: readonly TopTab[];
	className?: string;
}

/**
 * Terminal-style top tab strip. Each tab reads like a command name in
 * square brackets — active tab gets a green border + soft glow, others
 * sit in muted with a hover bump. Scroll-spies the sections to keep
 * the active tab in sync with viewport position.
 */
export function TopTabs({ items, className }: TopTabsProps) {
	const ids = items.map((i) => i.id);
	const active = useScrollSpy(ids);

	function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: "smooth", block: "start" });
		history.replaceState(null, "", `#${id}`);
	}

	return (
		<nav
			aria-label="Page sections"
			data-testid="top-tabs"
			className={cn(
				"flex items-center gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				className,
			)}
		>
			{items.map((item) => {
				const isActive = active === item.id;
				return (
					<a
						key={item.id}
						href={`#${item.id}`}
						onClick={(e) => jump(e, item.id)}
						data-testid={`top-tab-${item.id}`}
						data-active={isActive ? "true" : "false"}
						aria-current={isActive ? "location" : undefined}
						className={cn(
							"shrink-0 rounded-md border px-3 py-1 font-mono text-[12px] transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
							isActive
								? "border-accent/70 bg-accent/10 text-accent shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_30%,transparent),0_0_18px_-2px_color-mix(in_oklch,var(--accent)_45%,transparent)]"
								: "border-border/70 bg-bg/40 text-muted hover:border-border hover:text-fg/90",
						)}
					>
						[{item.label}]
					</a>
				);
			})}
		</nav>
	);
}
