import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { getProject, type Project, projects } from "#/content/site";
import { BentoGrid } from "../ui/bento-grid";
import { ProjectCard } from "./project-card";
import { ProjectModal } from "./project-modal";

function getCellSpan(index: number, total: number): string {
	if (index === 0) return "sm:col-span-2 sm:row-span-2";
	const remaining = total - 1;
	if (index === remaining && remaining > 2 && index >= 3) {
		return "sm:col-span-3 sm:row-span-1";
	}
	return "sm:col-span-1 sm:row-span-1";
}

function orderedProjects(): Project[] {
	const featured = projects.filter((p) => p.featured);
	const rest = projects.filter((p) => !p.featured);
	return [...featured, ...rest];
}

export function ProjectsBento() {
	const navigate = useNavigate();
	const search = useSearch({ from: "/" });
	const activeSlug =
		typeof search.project === "string" ? search.project : undefined;
	const activeProject = activeSlug ? getProject(activeSlug) : undefined;

	const ordered = useMemo(() => orderedProjects(), []);

	function handleOpen(slug: string) {
		navigate({
			to: "/",
			search: (prev) => ({ ...prev, project: slug }),
			replace: false,
		});
	}

	function handleClose() {
		navigate({
			to: "/",
			search: (prev) => ({ ...prev, project: undefined }),
			replace: false,
		});
	}

	return (
		<div data-testid="projects-bento">
			<BentoGrid className="grid-cols-1 sm:grid-cols-3 auto-rows-[18rem] sm:auto-rows-[16rem]">
				{ordered.map((project, i) => (
					<ProjectCard
						key={project.slug}
						project={project}
						size={i === 0 ? "hero" : "medium"}
						onOpen={handleOpen}
						className={getCellSpan(i, ordered.length)}
					/>
				))}
			</BentoGrid>
			<ProjectModal project={activeProject} onClose={handleClose} />
		</div>
	);
}
