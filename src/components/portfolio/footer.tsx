import { getProject, siteMeta } from "#/content/site";
import { ThemeSwitcher } from "./theme-switcher";

export function Footer() {
	const repo = getProject("agent-portfolio")?.links.repo;
	const year = new Date().getFullYear();

	return (
		<footer
			data-testid="portfolio-footer"
			className="relative mt-24 border-t border-border/40 pb-24 pt-10"
		>
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-sm text-muted md:flex-row md:justify-between">
				<p className="font-mono text-xs italic md:text-sm">{siteMeta.quip}</p>
				<div className="flex flex-wrap items-center gap-3 md:gap-4">
					<span data-testid="footer-year" className="font-mono text-xs">
						© {year}
					</span>
					{repo ? (
						<a
							data-testid="footer-source"
							href={repo}
							target="_blank"
							rel="noreferrer"
							className="font-mono text-xs text-fg/70 transition hover:text-accent"
						>
							source on github
						</a>
					) : null}
					<ThemeSwitcher />
				</div>
			</div>
		</footer>
	);
}
