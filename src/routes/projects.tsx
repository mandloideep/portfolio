import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PortfolioLayout } from "#/components/portfolio/portfolio-layout";
import { ProjectsBento } from "#/components/portfolio/projects-bento";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

const SearchSchema = z.object({
	project: z.string().optional(),
});

const TITLE = `${siteMeta.name} — projects`;
const DESCRIPTION =
	"Selected projects: production systems, research engineering, agent tooling.";

export const Route = createFileRoute("/projects")({
	component: ProjectsRoute,
	validateSearch: SearchSchema,
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			...buildOpenGraphMeta({
				title: TITLE,
				description: DESCRIPTION,
				path: "/projects",
				siteMeta,
			}),
		],
	}),
});

function ProjectsRoute() {
	return (
		<PortfolioLayout>
			<section className="flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-12">
				<CommandPrompt command="ls -la ~/projects" />
				<ProjectsBento />
			</section>
		</PortfolioLayout>
	);
}
