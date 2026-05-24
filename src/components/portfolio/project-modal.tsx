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
				className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
			>
				{project ? (
					<>
						<DialogHeader>
							<div className="flex items-center gap-3">
								<DialogTitle
									data-testid="project-modal-title"
									className="text-2xl font-medium tracking-tight"
								>
									{project.title}
								</DialogTitle>
								<Badge variant={STATUS_VARIANT[project.status]}>
									{project.status}
								</Badge>
							</div>
							<DialogDescription className="text-fg/75 text-sm">
								{project.summary}
							</DialogDescription>
						</DialogHeader>

						{project.links.poster ? (
							<img
								src={project.links.poster}
								alt={`${project.title} preview`}
								loading="lazy"
								data-testid="project-modal-poster"
								className="mt-2 w-full rounded-md border border-border/60 object-cover"
							/>
						) : null}

						<ul
							data-testid="project-modal-bullets"
							className="mt-2 list-disc list-inside space-y-1.5 text-sm text-fg/80"
						>
							{project.bullets.map((b) => (
								<li key={b}>{b}</li>
							))}
						</ul>

						<div className="mt-2 flex flex-wrap items-center gap-2">
							{project.tags.map((tag) => (
								<Badge
									key={tag}
									variant="outline"
									className="border-border/70 text-fg/70"
								>
									{tag}
								</Badge>
							))}
						</div>

						{(project.links.repo || project.links.live) && (
							<div
								className="mt-2 flex items-center gap-4"
								data-testid="project-modal-links"
							>
								{project.links.repo ? (
									<a
										href={project.links.repo}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-sm text-fg/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
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
										className="inline-flex items-center gap-1.5 text-sm text-fg/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
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
