import { research } from "#/content/site";
import { cn } from "#/lib/utils";
import { Badge } from "../ui/badge";

export function ResearchList({ className }: { className?: string }) {
	const ordered = [...research].sort((a, b) => b.year - a.year);

	return (
		<ol
			data-testid="research-list"
			className={cn("flex flex-col gap-5", className)}
		>
			{ordered.map((entry) => (
				<li
					key={entry.slug}
					data-testid={`research-card-${entry.slug}`}
					className="group flex flex-col gap-2.5 rounded-md border border-border/70 bg-bg-elev/60 p-5 transition-colors hover:border-accent/50"
				>
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant="default"
							className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
						>
							{entry.year}
						</Badge>
						<Badge
							variant="outline"
							className="border-border/70 font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg/80"
						>
							{entry.venue}
						</Badge>
					</div>
					<h3 className="font-display text-[1.25rem] font-medium leading-[1.15] tracking-tight text-fg md:text-[1.4rem]">
						{entry.title}
					</h3>
					<p className="text-[0.95rem] leading-[1.6] text-fg/85">
						{entry.abstract}
					</p>
					{entry.tags.length > 0 ? (
						<div className="flex flex-wrap items-center gap-1.5 pt-1">
							{entry.tags.map((tag) => (
								<Badge
									key={tag}
									variant="outline"
									className="border-border/60 bg-bg/40 font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg/75"
								>
									{tag}
								</Badge>
							))}
						</div>
					) : null}
				</li>
			))}
		</ol>
	);
}
