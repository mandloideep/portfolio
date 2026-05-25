import { research } from "#/content/site";
import { cn } from "#/lib/utils";

export function ResearchList({ className }: { className?: string }) {
	const ordered = [...research].sort((a, b) => b.year - a.year);

	return (
		<ol
			data-testid="research-list"
			className={cn("flex flex-col gap-3", className)}
		>
			{ordered.map((entry) => (
				<li
					key={entry.slug}
					data-testid={`research-card-${entry.slug}`}
					className="rounded-md border border-border/70 bg-bg-elev/50 px-5 py-4"
				>
					<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono">
						<h3 className="text-[14px] text-fg">
							<span className="text-accent">›</span> {entry.title}
						</h3>
						<span className="shrink-0 text-[11px] tracking-wider text-muted [font-variant-numeric:tabular-nums]">
							{entry.year}
						</span>
					</div>
					<div className="mt-0.5 font-mono text-[12.5px] text-link">
						{entry.venue}
					</div>
					<p className="mt-3 font-mono text-[12.5px] leading-[1.6] text-fg/85">
						{entry.abstract}
					</p>
					{entry.tags.length > 0 ? (
						<div className="mt-3 flex flex-wrap items-center gap-1.5">
							{entry.tags.map((tag) => (
								<span
									key={tag}
									data-slot="badge"
									className="inline-flex items-center rounded-sm border border-border/70 bg-bg/40 px-2 py-0.5 font-mono text-[10.5px] text-fg/80"
								>
									{tag}
								</span>
							))}
						</div>
					) : null}
				</li>
			))}
		</ol>
	);
}
