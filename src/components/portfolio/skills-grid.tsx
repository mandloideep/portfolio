import { skills } from "#/content/site";
import { cn } from "#/lib/utils";

export function SkillsGrid({ className }: { className?: string }) {
	return (
		<div
			data-testid="skills-grid"
			className={cn("flex flex-col gap-7", className)}
		>
			{skills.map((group) => (
				<div
					key={group.group}
					data-testid={`skill-group-${group.group}`}
					className="flex flex-col gap-3"
				>
					<h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
						<span aria-hidden="true" className="text-accent">
							$
						</span>{" "}
						<span>{group.group}</span>
						<span
							aria-hidden="true"
							className="ml-1 flex-1 border-t border-border/70"
						/>
					</h3>
					<div className="flex flex-wrap gap-1.5">
						{group.items.map((item) => (
							<span
								key={item}
								data-slot="badge"
								className="inline-flex items-center rounded-sm border border-border/70 bg-bg-elev/60 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-fg/90"
							>
								{item}
							</span>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
