import { useScrollSpy } from "#/hooks/use-scroll-spy";
import { cn } from "#/lib/utils";

export interface DockItem {
	id: string;
	label: string;
}

export interface DockNavProps {
	items: readonly DockItem[];
	className?: string;
}

export function DockNav({ items, className }: DockNavProps) {
	const ids = items.map((i) => i.id);
	const active = useScrollSpy(ids);

	function jump(id: string) {
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	return (
		<nav
			aria-label="Page sections"
			className={cn(
				"hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30",
				className,
			)}
		>
			<ul
				data-testid="dock-nav"
				className="flex items-center gap-0.5 rounded-pill border border-border/80 bg-bg-elev/80 px-2 py-1.5 backdrop-blur-md shadow-card"
			>
				{items.map((item) => {
					const isActive = active === item.id;
					return (
						<li key={item.id}>
							<button
								type="button"
								onClick={() => jump(item.id)}
								data-testid={`dock-item-${item.id}`}
								data-active={isActive ? "true" : "false"}
								aria-current={isActive ? "location" : undefined}
								className={cn(
									"relative px-3 py-1.5 rounded-pill font-mono text-eyebrow uppercase tracking-tab transition-colors duration-base",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
									isActive
										? "bg-accent/15 text-accent"
										: "text-muted hover:text-fg",
								)}
							>
								{item.label}
								{isActive ? (
									<span
										aria-hidden="true"
										className="absolute left-1/2 -bottom-[3px] h-[2px] w-5 -translate-x-1/2 rounded-pill bg-accent"
									/>
								) : null}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
