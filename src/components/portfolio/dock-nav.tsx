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
				className="flex items-center gap-1 rounded-full border border-border bg-bg/70 px-2 py-1.5 backdrop-blur-md shadow-lg shadow-black/20"
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
									"px-3 py-1.5 rounded-full text-xs font-medium transition",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
									isActive
										? "bg-accent/15 text-accent"
										: "text-muted hover:text-fg",
								)}
							>
								{item.label}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
