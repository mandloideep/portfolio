import { CommandPrompt } from "#/components/ui/command-prompt";
import { StatCard } from "#/components/ui/stat-card";
import type { Project } from "#/content/site";
import { projects } from "#/content/site";
import { GithubGraph } from "./github-graph";
import { Hero } from "./hero";
import { PortfolioLayout } from "./portfolio-layout";

const SECTION_PADDING = "px-6 py-10 sm:px-10 sm:py-12";

function ProjectStatBlock({ project }: { project: Project }) {
	if (!project.stats || project.stats.length === 0) return null;
	const command = project.endpoint ?? `cat ~/projects/${project.slug}.log`;
	const ctaHref = project.links.live ?? project.links.repo;
	const cta = project.cta ?? "view";

	return (
		<section
			data-testid={`whoami-stat-${project.slug}`}
			className={`flex flex-col gap-4 border-t border-border/60 ${SECTION_PADDING}`}
		>
			<CommandPrompt
				command={command}
				trailing={
					ctaHref ? (
						<a
							href={ctaHref}
							target="_blank"
							rel="noreferrer"
							className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
						>
							{cta}
						</a>
					) : (
						cta
					)
				}
			/>
			<p className="max-w-3xl font-mono text-[14px] leading-[1.7] text-fg/85">
				{project.pitch ?? project.summary}
			</p>
			<div
				className={`grid gap-3 ${
					project.stats.length === 4
						? "grid-cols-2 sm:grid-cols-4"
						: project.stats.length === 3
							? "grid-cols-1 sm:grid-cols-3"
							: "grid-cols-1 sm:grid-cols-2"
				}`}
			>
				{project.stats.map((s) => (
					<StatCard
						key={s.label}
						value={s.value}
						label={s.label}
						sublabel={s.sublabel}
						pulse={s.pulse}
					/>
				))}
			</div>
		</section>
	);
}

/**
 * The whoami page. Profile card up top, then a stat summary block per
 * featured project, then a GitHub contributions graph block at the
 * bottom. Each block reads as `$ command → cta` over its content.
 */
export function PortfolioPage() {
	const featured = projects.filter((p) => p.featured && p.stats);

	return (
		<PortfolioLayout>
			<section className={SECTION_PADDING}>
				<Hero />
			</section>

			{featured.map((p) => (
				<ProjectStatBlock key={p.slug} project={p} />
			))}

			<section
				className={`flex flex-col gap-5 border-t border-border/60 ${SECTION_PADDING}`}
			>
				<CommandPrompt command={`git log --author="deep" --oneline | wc -l`} />
				<GithubGraph />
			</section>
		</PortfolioLayout>
	);
}
