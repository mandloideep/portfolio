import { getProject, siteMeta } from "#/content/site";
import { Eyebrow } from "../ui/eyebrow";
import { RuleAccent } from "../ui/rule-accent";
import { ThemeSwitcher } from "./theme-switcher";

export function Footer() {
	const repo = getProject("agent-portfolio")?.links.repo;
	const year = new Date().getFullYear();

	return (
		<footer
			data-testid="portfolio-footer"
			className="relative mt-24 border-t border-border/60 pb-28 pt-16"
		>
			<div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
				<div className="flex flex-col gap-4">
					<Eyebrow as="p">Get in touch</Eyebrow>
					<h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.02] tracking-tight text-fg">
						Let&apos;s build something
						<span className="text-accent">.</span>
					</h2>
					<RuleAccent className="mt-1 max-w-[8rem]" variant="solid" />
				</div>

				<div className="flex flex-col items-start justify-between gap-4 text-sm text-muted md:flex-row md:items-center">
					<p className="font-mono text-xs italic md:text-sm">{siteMeta.quip}</p>
					<div className="flex flex-wrap items-center gap-4">
						<span
							data-testid="footer-year"
							className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
						>
							© {year}
						</span>
						{repo ? (
							<a
								data-testid="footer-source"
								href={repo}
								target="_blank"
								rel="noreferrer"
								className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/80 transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
							>
								source on github
							</a>
						) : null}
						<ThemeSwitcher />
					</div>
				</div>
			</div>
		</footer>
	);
}
