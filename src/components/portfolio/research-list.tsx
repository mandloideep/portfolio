import { Card } from "#/components/ui/card";
import { Pill } from "#/components/ui/pill";
import { TechIcon } from "#/components/ui/tech-icon";
import type { TimelineStatusT } from "#/content/site";
import { research } from "#/content/site";
import { cn } from "#/lib/utils";

const TIMELINE_GLYPH: Record<TimelineStatusT, string> = {
	done: "✓",
	wip: "◐",
	pending: "○",
};

const TIMELINE_TONE: Record<TimelineStatusT, string> = {
	done: "text-accent",
	wip: "text-accent",
	pending: "text-muted",
};

export function ResearchList({ className }: { className?: string }) {
	const ordered = [...research].sort((a, b) => b.year - a.year);

	return (
		<ol
			data-testid="research-list"
			className={cn("flex flex-col gap-4", className)}
		>
			{ordered.map((entry) => {
				const cta = entry.links?.poster
					? { href: entry.links.poster, label: "view poster" }
					: entry.links?.github
						? { href: entry.links.github, label: "github" }
						: null;

				return (
					<Card
						as="li"
						key={entry.slug}
						data-testid={`research-card-${entry.slug}`}
						className="px-6 py-6"
					>
						<div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2 font-mono">
							<div className="flex items-baseline gap-2.5">
								<span aria-hidden="true" className="text-sm text-accent">
									●
								</span>
								<h3 className="text-lg font-medium leading-snug text-fg">
									{entry.title}
								</h3>
							</div>
							{cta ? (
								<a
									data-testid={`research-link-${entry.slug}`}
									href={cta.href}
									target="_blank"
									rel="noreferrer"
									className="shrink-0 font-mono text-meta text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
								>
									<span aria-hidden="true" className="text-accent">
										→
									</span>{" "}
									{cta.label}
								</a>
							) : (
								<span className="shrink-0 font-mono text-meta tracking-wide text-muted [font-variant-numeric:tabular-nums]">
									{entry.year}
								</span>
							)}
						</div>
						<div className="mt-1.5 font-mono text-sm text-link">
							{entry.venue} · {entry.year}
						</div>
						<p className="mt-4 font-mono text-base leading-relaxed text-fg/90">
							{entry.abstract}
						</p>
						{entry.tags.length > 0 ? (
							<div className="mt-4 flex flex-wrap items-center gap-1.5">
								{entry.tags.map((tag) => (
									<Pill key={tag} size="sm" className="gap-1.5">
										<TechIcon label={tag} className="size-3.5 text-fg/70" />
										{tag}
									</Pill>
								))}
							</div>
						) : null}
						{entry.timeline && entry.timeline.length > 0 ? (
							<div className="mt-6 border-t border-border/60 pt-5">
								<div className="mb-3 font-mono text-eyebrow uppercase tracking-eyebrow text-muted">
									timeline
								</div>
								<ol
									data-testid={`research-timeline-${entry.slug}`}
									className="flex flex-col gap-2 font-mono text-sm"
								>
									{entry.timeline.map((step) => (
										<li
											key={step.label}
											className="flex flex-wrap items-baseline gap-3"
										>
											<span
												aria-hidden="true"
												className={cn(
													"shrink-0 select-none w-4 text-center",
													TIMELINE_TONE[step.status],
												)}
											>
												{TIMELINE_GLYPH[step.status]}
											</span>
											<span
												className={cn(
													"min-w-0 flex-1 sm:flex-none sm:w-56",
													step.status === "pending"
														? "text-muted"
														: "text-fg/95",
												)}
											>
												{step.label}
											</span>
											{step.range ? (
												<span className="text-meta tracking-wide text-muted [font-variant-numeric:tabular-nums]">
													{step.range}
												</span>
											) : null}
										</li>
									))}
								</ol>
							</div>
						) : null}
					</Card>
				);
			})}
		</ol>
	);
}
