import { ExternalLink, Github } from "lucide-react";
import { useId } from "react";
import type { Project, ProjectStatusT } from "#/content/site";
import { cn } from "#/lib/utils";

const STATUS_LABEL: Record<ProjectStatusT, string> = {
	running: "RUNNING",
	complete: "COMPLETE",
	wip: "WIP",
	archived: "ARCHIVED",
};

const STATUS_TONE: Record<ProjectStatusT, string> = {
	running:
		"border-accent/60 bg-accent/10 text-accent shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_25%,transparent)]",
	complete: "border-link/50 bg-link/10 text-link",
	wip: "border-muted/40 bg-muted/10 text-fg/85",
	archived: "border-muted/40 bg-muted/10 text-muted",
};

export interface ProjectRowProps {
	project: Project;
	expanded: boolean;
	meta?: string;
	onToggle: (slug: string) => void;
}

/**
 * Terminal-styled project row: `/slug [STATUS]  right-meta`. Click the
 * header to expand inline; the expanded body shows bullets, stack tags,
 * and live/repo links. `meta` is freeform terminal-style metadata (e.g.
 * "1.2k visitors/mo · 2 universities · up 1089 days").
 */
export function ProjectRow({
	project,
	expanded,
	meta,
	onToggle,
}: ProjectRowProps) {
	const panelId = useId();

	return (
		<div
			data-testid={`project-card-${project.slug}`}
			data-expanded={expanded ? "true" : "false"}
			className={cn(
				"rounded-md border bg-bg-elev/50 transition-colors",
				expanded
					? "border-accent/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_25%,transparent)]"
					: "border-border/70 hover:border-border",
			)}
		>
			<button
				type="button"
				data-testid={`project-card-open-${project.slug}`}
				onClick={() => onToggle(project.slug)}
				aria-expanded={expanded}
				aria-controls={panelId}
				className="flex w-full flex-col gap-2 rounded-md px-4 py-3 text-left font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4"
			>
				<span className="flex shrink-0 items-center gap-3">
					<span className="text-[13.5px] text-accent">/{project.slug}</span>
					<span
						data-testid={`project-status-${project.slug}`}
						className={cn(
							"shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.16em]",
							STATUS_TONE[project.status],
						)}
					>
						[{STATUS_LABEL[project.status]}]
					</span>
				</span>
				<span className="flex flex-1 items-center justify-between gap-3">
					<span className="text-[12.5px] text-fg/80">
						{meta ?? project.summary}
					</span>
					<span aria-hidden="true" className="shrink-0 text-[11px] text-muted">
						{expanded ? "▼ collapse" : "▶ expand"}
					</span>
				</span>
			</button>

			{expanded ? (
				<div
					id={panelId}
					className="border-t border-border/60 px-4 py-4 sm:px-6 sm:py-5"
				>
					<ul className="flex flex-col gap-2 font-mono text-[13px] leading-[1.55] text-fg/90">
						{project.bullets.map((b) => (
							<li key={b} className="flex gap-2.5">
								<span
									aria-hidden="true"
									className="shrink-0 select-none text-accent"
								>
									→
								</span>
								<span>{b}</span>
							</li>
						))}
					</ul>

					<div className="mt-4 flex flex-wrap items-center gap-1.5">
						{project.tags.map((tag) => (
							<span
								key={tag}
								data-slot="badge"
								className="inline-flex items-center rounded-sm border border-border/70 bg-bg/40 px-2 py-0.5 font-mono text-[10.5px] text-fg/80"
							>
								{tag}
							</span>
						))}
					</div>

					{(project.links.repo || project.links.live) && (
						<div
							className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[12px]"
							data-testid={`project-links-${project.slug}`}
						>
							{project.links.live ? (
								<a
									href={project.links.live}
									target="_blank"
									rel="noopener noreferrer"
									data-testid={`project-link-live-${project.slug}`}
									className="inline-flex items-center gap-1.5 text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
								>
									<span aria-hidden="true" className="text-accent">
										→
									</span>
									<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
									live site
								</a>
							) : null}
							{project.links.repo ? (
								<a
									href={project.links.repo}
									target="_blank"
									rel="noopener noreferrer"
									data-testid={`project-link-repo-${project.slug}`}
									className="inline-flex items-center gap-1.5 text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
								>
									<span aria-hidden="true" className="text-accent">
										→
									</span>
									<Github className="h-3.5 w-3.5" aria-hidden="true" />
									repo
								</a>
							) : null}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
