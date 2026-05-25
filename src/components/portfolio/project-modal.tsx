import { ExternalLink, Github } from "lucide-react";
import type { Project, ProjectStatusT } from "#/content/site";
import { Badge } from "../ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Eyebrow } from "../ui/eyebrow";
import { RuleAccent } from "../ui/rule-accent";

const STATUS_VARIANT: Record<
	ProjectStatusT,
	"default" | "secondary" | "outline"
> = {
	running: "default",
	complete: "secondary",
	wip: "outline",
	archived: "outline",
};

export interface ProjectModalProps {
	project: Project | undefined;
	onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
	const open = project !== undefined;

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<DialogContent
				data-testid="project-modal"
				className="max-h-[85vh] overflow-y-auto gap-5 sm:max-w-2xl"
			>
				{project ? (
					<>
						<DialogHeader className="gap-3">
							<div className="flex items-center justify-between gap-3">
								<Eyebrow className="text-accent">
									project · {project.slug}
								</Eyebrow>
								<Badge
									variant={STATUS_VARIANT[project.status]}
									className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]"
								>
									{project.status}
								</Badge>
							</div>
							<DialogTitle
								data-testid="project-modal-title"
								className="font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-medium leading-[1.02] tracking-tight"
							>
								{project.title}
							</DialogTitle>
							<RuleAccent variant="solid" className="max-w-[5rem]" />
							<DialogDescription className="text-[0.95rem] leading-[1.6] text-fg/85">
								{project.summary}
							</DialogDescription>
						</DialogHeader>

						{project.links.poster ? (
							<img
								src={project.links.poster}
								alt={`${project.title} preview`}
								loading="lazy"
								data-testid="project-modal-poster"
								className="w-full rounded-md border border-border/70 object-cover"
							/>
						) : null}

						<div className="flex flex-col gap-2">
							<Eyebrow>highlights</Eyebrow>
							<ul
								data-testid="project-modal-bullets"
								className="flex flex-col gap-2 text-[0.95rem] leading-[1.6] text-fg/90"
							>
								{project.bullets.map((b) => (
									<li key={b} className="flex gap-2.5">
										<span
											aria-hidden="true"
											className="shrink-0 select-none pt-1 text-accent"
										>
											▸
										</span>
										<span>{b}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="flex flex-col gap-2">
							<Eyebrow>stack</Eyebrow>
							<div className="flex flex-wrap items-center gap-1.5">
								{project.tags.map((tag) => (
									<Badge
										key={tag}
										variant="outline"
										className="border-border/70 bg-bg/40 font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg/80"
									>
										{tag}
									</Badge>
								))}
							</div>
						</div>

						{(project.links.repo || project.links.live) && (
							<div
								className="flex items-center gap-4 border-t border-border/60 pt-4"
								data-testid="project-modal-links"
							>
								{project.links.repo ? (
									<a
										href={project.links.repo}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/85 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
									>
										<Github className="h-4 w-4" aria-hidden="true" />
										repository
									</a>
								) : null}
								{project.links.live ? (
									<a
										href={project.links.live}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/85 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
									>
										<ExternalLink className="h-4 w-4" aria-hidden="true" />
										live site
									</a>
								) : null}
							</div>
						)}
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
