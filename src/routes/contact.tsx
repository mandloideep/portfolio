import { createFileRoute } from "@tanstack/react-router";
import { ContactCard } from "#/components/portfolio/contact-card";
import { PortfolioLayout } from "#/components/portfolio/portfolio-layout";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

const TITLE = `${siteMeta.name} — contact`;
const DESCRIPTION = "How to reach me: email, github, linkedin, terminal.";

export const Route = createFileRoute("/contact")({
	component: ContactRoute,
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			...buildOpenGraphMeta({
				title: TITLE,
				description: DESCRIPTION,
				path: "/contact",
				siteMeta,
			}),
		],
	}),
});

function ContactRoute() {
	return (
		<PortfolioLayout>
			<section className="flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-12">
				<CommandPrompt command="cat ~/contact.sh" />
				<ContactCard />
				<p
					data-testid="contact-hint"
					className="text-center font-mono text-sm text-muted"
				>
					<span className="text-accent">hint:</span> email is the fastest way to
					reach me
				</p>
			</section>
		</PortfolioLayout>
	);
}
