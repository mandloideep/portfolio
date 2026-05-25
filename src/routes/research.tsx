import { createFileRoute } from "@tanstack/react-router";
import { PortfolioLayout } from "#/components/portfolio/portfolio-layout";
import { ResearchList } from "#/components/portfolio/research-list";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

const TITLE = `${siteMeta.name} — research`;
const DESCRIPTION = "Research notes, papers, and write-ups.";

export const Route = createFileRoute("/research")({
	component: ResearchRoute,
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			...buildOpenGraphMeta({
				title: TITLE,
				description: DESCRIPTION,
				path: "/research",
				siteMeta,
			}),
		],
	}),
});

function ResearchRoute() {
	return (
		<PortfolioLayout>
			<section className="flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-12">
				<CommandPrompt command="cat ~/research.md" />
				<ResearchList />
			</section>
		</PortfolioLayout>
	);
}
