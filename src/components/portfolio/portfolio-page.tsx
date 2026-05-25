import { TerminalFrame } from "#/components/ui/terminal-frame";
import { siteMeta } from "#/content/site";
import { ContactCard } from "./contact-card";
import { ExperienceTimeline } from "./experience-timeline";
import { Footer } from "./footer";
import { GithubGraph } from "./github-graph";
import { Hero } from "./hero";
import { ProjectsBento } from "./projects-bento";
import { ResearchList } from "./research-list";
import { PortfolioSection } from "./section";
import { type TopTab, TopTabs } from "./top-tabs";

type SectionDef = TopTab & {
	command: string;
	trailing?: React.ReactNode;
	title: string;
};

const SECTIONS: ReadonlyArray<SectionDef> = [
	{
		id: "hero",
		label: "whoami",
		title: "intro",
		command: "cat whoami",
	},
	{
		id: "projects",
		label: "/projects",
		title: "projects",
		command: "ls -la ~/projects",
	},
	{
		id: "experience",
		label: "/experience",
		title: "experience",
		command: "cat ~/experience.md",
	},
	{
		id: "research",
		label: "/research",
		title: "research",
		command: "cat ~/research.md",
	},
	{
		id: "github",
		label: "/github",
		title: "github",
		command: `git log --author="${siteMeta.name.split(" ")[0]?.toLowerCase()}" --oneline | wc -l`,
	},
	{
		id: "contact",
		label: "/contact",
		title: "contact",
		command: "cat ~/contact.md",
	},
] as const;

export function PortfolioPage() {
	return (
		<div
			data-page="portfolio"
			className="surface-grain relative min-h-screen bg-bg px-3 py-6 sm:px-6 sm:py-10"
		>
			<TerminalFrame
				title={`${siteMeta.name.split(" ")[0]?.toLowerCase()} — portfolio — 80×24`}
				chrome={<TopTabs items={SECTIONS} />}
			>
				<main id="main" className="flex flex-col divide-y divide-border/60">
					<h1 className="sr-only">
						{siteMeta.name} — {siteMeta.role}
					</h1>
					{SECTIONS.map((s) => (
						<PortfolioSection
							key={s.id}
							id={s.id}
							title={s.title}
							command={s.command}
							trailing={s.trailing}
						>
							{s.id === "hero" ? (
								<Hero />
							) : s.id === "projects" ? (
								<ProjectsBento />
							) : s.id === "experience" ? (
								<ExperienceTimeline />
							) : s.id === "research" ? (
								<ResearchList />
							) : s.id === "github" ? (
								<GithubGraph />
							) : s.id === "contact" ? (
								<ContactCard />
							) : (
								<p className="text-muted text-sm">
									placeholder — content lands in a later phase.
								</p>
							)}
						</PortfolioSection>
					))}
					<Footer />
				</main>
			</TerminalFrame>
		</div>
	);
}
