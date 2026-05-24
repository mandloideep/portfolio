import { research } from "#/content/site";
import { cn } from "#/lib/utils";
import { Badge } from "../ui/badge";

export function ResearchList({ className }: { className?: string }) {
	const ordered = [...research].sort((a, b) => b.year - a.year);

	return (
		<ol
			data-testid="research-list"
			className={cn("flex flex-col gap-6", className)}
		>
			{ordered.map((entry) => (
				<li
					key={entry.slug}
					data-testid={`research-card-${entry.slug}`}
					className="flex flex-col gap-2 rounded-md border border-border/60 bg-bg/40 p-4"
				>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="default">{entry.year}</Badge>
						<Badge variant="outline" className="border-border/70 text-fg/70">
							{entry.venue}
						</Badge>
					</div>
					<h3 className="text-base font-medium tracking-tight text-fg md:text-lg">
						{entry.title}
					</h3>
					<p className="text-sm text-fg/80">{entry.abstract}</p>
					{entry.tags.length > 0 ? (
						<div className="flex flex-wrap items-center gap-2 pt-1">
							{entry.tags.map((tag) => (
								<Badge
									key={tag}
									variant="outline"
									className="border-border/70 text-fg/70"
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
