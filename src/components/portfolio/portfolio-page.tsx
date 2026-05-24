import { AnimatedBackground } from "./animated-background";
import { ContactCard } from "./contact-card";
import { type DockItem, DockNav } from "./dock-nav";
import { ExperienceTimeline } from "./experience-timeline";
import { Footer } from "./footer";
import { GithubGraph } from "./github-graph";
import { Hero } from "./hero";
import { ProjectsBento } from "./projects-bento";
import { ResearchList } from "./research-list";
import { PortfolioSection } from "./section";
import { SkillsGrid } from "./skills-grid";

const SECTIONS: ReadonlyArray<DockItem & { eyebrow: string; title: string }> = [
	{ id: "hero", label: "intro", eyebrow: "cat ~/intro", title: "intro" },
	{
		id: "projects",
		label: "projects",
		eyebrow: "ls ~/projects",
		title: "projects",
	},
	{
		id: "experience",
		label: "experience",
		eyebrow: "cat ~/experience.md",
		title: "experience",
	},
	{
		id: "skills",
		label: "skills",
		eyebrow: "cat ~/skills.md",
		title: "skills & research",
	},
	{
		id: "github",
		label: "github",
		eyebrow: "git log --graph",
		title: "github",
	},
	{
		id: "contact",
		label: "contact",
		eyebrow: "cat ~/contact.md",
		title: "contact",
	},
] as const;

export function PortfolioPage() {
	return (
		<div data-page="portfolio" className="relative min-h-screen">
			<AnimatedBackground />

			<a
				href="#hero"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-bg focus:px-3 focus:py-2 focus:text-accent focus:ring-2 focus:ring-accent"
			>
				skip to content
			</a>

			<main id="main" className="relative">
				{SECTIONS.map((s) => (
					<PortfolioSection
						key={s.id}
						id={s.id}
						title={s.title}
						eyebrow={s.eyebrow}
					>
						{s.id === "hero" ? (
							<Hero />
						) : s.id === "projects" ? (
							<ProjectsBento />
						) : s.id === "experience" ? (
							<ExperienceTimeline />
						) : s.id === "skills" ? (
							<div className="grid grid-cols-1 gap-10 md:grid-cols-2">
								<SkillsGrid />
								<ResearchList />
							</div>
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
			</main>

			<Footer />

			<DockNav items={SECTIONS} />
		</div>
	);
}
