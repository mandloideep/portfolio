import { skills } from "#/content/site";
import { cn } from "#/lib/utils";
import { Badge } from "../ui/badge";

export function SkillsGrid({ className }: { className?: string }) {
	return (
		<div
			data-testid="skills-grid"
			className={cn("flex flex-col gap-6", className)}
		>
			{skills.map((group) => (
				<div
					key={group.group}
					data-testid={`skill-group-${group.group}`}
					className="flex flex-col gap-2"
				>
					<h3 className="font-mono text-xs uppercase tracking-wider text-muted">
						<span aria-hidden="true" className="text-accent">
							$
						</span>{" "}
						{group.group}
					</h3>
					<div className="flex flex-wrap gap-2">
						{group.items.map((item) => (
							<Badge
								key={item}
								variant="outline"
								className="border-border/70 text-fg/70"
							>
								{item}
							</Badge>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
