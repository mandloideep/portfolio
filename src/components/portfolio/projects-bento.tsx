import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProjectPopupProvider } from "#/components/project/project-popup-provider";
import { type Project, projects } from "#/content/site";
import { ProjectRow } from "./project-row";

function orderedProjects(): Project[] {
	const featured = projects.filter((p) => p.featured);
	const rest = projects.filter((p) => !p.featured);
	return [...featured, ...rest];
}

/**
 * Renders projects as a stack of collapsible filetree-style rows. The
 * active project is tracked in the URL (`?project=<slug>`) so deep links
 * still work; the first featured project defaults to expanded on initial
 * mount when no query param is present.
 */
export function ProjectsBento() {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { project?: string };
	const activeSlug =
		typeof search.project === "string" ? search.project : undefined;

	const ordered = useMemo(() => orderedProjects(), []);
	const defaultSlug = activeSlug ?? ordered[0]?.slug;

	function handleToggle(slug: string) {
		const next = slug === activeSlug ? undefined : slug;
		navigate({
			to: "/projects",
			search: (prev) => ({ ...prev, project: next }),
			replace: false,
		});
	}

	return (
		<ProjectPopupProvider>
			<div data-testid="projects-bento" className="flex flex-col gap-2.5">
				<div className="flex items-center gap-3 px-4 pb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
					<span className="w-32">name</span>
					<span className="w-20">status</span>
					<span className="flex-1">description</span>
				</div>
				{ordered.map((project) => (
					<ProjectRow
						key={project.slug}
						project={project}
						expanded={defaultSlug === project.slug}
						onToggle={handleToggle}
					/>
				))}
			</div>
		</ProjectPopupProvider>
	);
}
