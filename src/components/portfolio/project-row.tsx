import { ExternalLink, FileText, Github } from "lucide-react";
import { useId } from "react";
import { useProjectPopup } from "#/components/project/project-popup-provider";
import { Card } from "#/components/ui/card";
import { Pill } from "#/components/ui/pill";
import { TechIcon } from "#/components/ui/tech-icon";
import type { Project, ProjectStatusT } from "#/content/site";

const STATUS_LABEL: Record<ProjectStatusT, string> = {
	running: "RUNNING",
	complete: "COMPLETE",
	wip: "WIP",
	archived: "ARCHIVED",
};

const STATUS_TONE: Record<
	ProjectStatusT,
	"accent" | "link" | "warn" | "muted"
> = {
	running: "accent",
	complete: "link",
	wip: "warn",
	archived: "muted",
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
 * and live/repo links.
 */
export function ProjectRow({
	project,
	expanded,
	meta,
	onToggle,
}: ProjectRowProps) {
	const panelId = useId();
	const popup = useProjectPopup();

	return (
		<Card
			tone={expanded ? "accent" : "default"}
			data-testid={`project-card-${project.slug}`}
			data-expanded={expanded ? "true" : "false"}
		>
			<button
				type="button"
				data-testid={`project-card-open-${project.slug}`}
				onClick={() => onToggle(project.slug)}
				aria-expanded={expanded}
				aria-controls={panelId}
				className="flex min-h-12 w-full flex-col gap-2 rounded-card px-4 py-3 text-left font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4"
			>
				<span className="flex shrink-0 items-center gap-3">
					<span className="text-base text-accent">/{project.slug}</span>
					<Pill
						tone={STATUS_TONE[project.status]}
						size="xs"
						data-testid={`project-status-${project.slug}`}
						className="tracking-tab"
					>
						[{STATUS_LABEL[project.status]}]
					</Pill>
				</span>
				<span className="flex flex-1 items-center justify-between gap-3">
					<span className="text-sm text-fg/80">{meta ?? project.summary}</span>
					<span aria-hidden="true" className="shrink-0 text-meta text-muted">
						{expanded ? "▼ collapse" : "▶ expand"}
					</span>
				</span>
			</button>

			{expanded ? (
				<div
					id={panelId}
					className="border-t border-border/60 px-4 py-4 sm:px-7 sm:py-6"
				>
					<ul className="flex flex-col gap-2.5 font-mono text-base leading-relaxed text-fg/90">
						{project.bullets.map((b) => (
							<li key={b} className="flex gap-2.5">
								<span
									aria-hidden="true"
									className="shrink-0 select-none pt-0.5 text-accent"
								>
									→
								</span>
								<span>{b}</span>
							</li>
						))}
					</ul>

					<div className="mt-4 flex flex-wrap items-center gap-1.5">
						{project.tags.map((tag) => (
							<Pill key={tag} size="sm" className="gap-1.5">
								<TechIcon label={tag} className="size-3.5 text-fg/70" />
								{tag}
							</Pill>
						))}
					</div>

					<div
						className="mt-5 flex flex-wrap items-center gap-4 font-mono text-base sm:gap-5 sm:text-sm"
						data-testid={`project-links-${project.slug}`}
					>
						{popup ? (
							<button
								type="button"
								data-testid={`project-link-readme-${project.slug}`}
								onClick={() => popup.open(project.slug)}
								className="inline-flex min-h-9 items-center gap-1.5 text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline sm:min-h-0"
							>
								<span aria-hidden="true" className="text-accent">
									→
								</span>
								<FileText className="h-3.5 w-3.5" aria-hidden="true" />
								read more
							</button>
						) : null}
						{project.links.live ? (
							<a
								href={project.links.live}
								target="_blank"
								rel="noopener noreferrer"
								data-testid={`project-link-live-${project.slug}`}
								className="inline-flex min-h-9 items-center gap-1.5 text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline sm:min-h-0"
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
								className="inline-flex min-h-9 items-center gap-1.5 text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline sm:min-h-0"
							>
								<span aria-hidden="true" className="text-accent">
									→
								</span>
								<Github className="h-3.5 w-3.5" aria-hidden="true" />
								repo
							</a>
						) : null}
					</div>
				</div>
			) : null}
		</Card>
	);
}
