import { createFileRoute } from "@tanstack/react-router";
import { ExperienceTimeline } from "#/components/portfolio/experience-timeline";
import { PortfolioLayout } from "#/components/portfolio/portfolio-layout";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

const TITLE = `${siteMeta.name} — experience`;
const DESCRIPTION =
	"Roles, responsibilities, and impact across research, full-stack, and platform work.";

export const Route = createFileRoute("/experience")({
	component: ExperienceRoute,
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			...buildOpenGraphMeta({
				title: TITLE,
				description: DESCRIPTION,
				path: "/experience",
				siteMeta,
			}),
		],
	}),
});

function ExperienceRoute() {
	return (
		<PortfolioLayout>
			<section className="flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-12">
				<CommandPrompt command="cat ~/experience.log" />
				<ExperienceTimeline />
			</section>
		</PortfolioLayout>
	);
}
