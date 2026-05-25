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
					className="rounded-md border border-border/70 bg-bg-elev/50 px-6 py-5"
				>
					<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 font-mono">
						<div className="flex items-baseline gap-2.5">
							<span aria-hidden="true" className="text-accent">
								●
							</span>
							<h3 className="text-[15px] font-medium text-fg">{entry.title}</h3>
						</div>
						<span className="shrink-0 text-[12px] tracking-wider text-link [font-variant-numeric:tabular-nums]">
							{entry.year}
						</span>
					</div>
					<div className="mt-1 font-mono text-[13px] text-link">
						{entry.venue}
					</div>
					<p className="mt-4 font-mono text-[13.5px] leading-[1.7] text-fg/85">
						{entry.abstract}
					</p>
					{entry.tags.length > 0 ? (
						<div className="mt-4 flex flex-wrap items-center gap-1.5">
							{entry.tags.map((tag) => (
								<span
									key={tag}
									data-slot="badge"
									className="inline-flex items-center rounded-sm border border-border/70 bg-bg/40 px-2 py-0.5 font-mono text-[11px] text-fg/80"
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
