import { getProject, siteMeta } from "#/content/site";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * Terminal-prompt footer line: `$ <quip>`. Trails with year + source link
 * + theme switcher on the right, styled as terminal output.
 */
export function Footer() {
	const repo = getProject("agent-portfolio")?.links.repo;
	const year = new Date().getFullYear();

	return (
		<footer
			data-testid="portfolio-footer"
			className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 font-mono text-[12.5px] text-muted sm:px-10"
		>
			<p className="flex items-baseline gap-2 italic">
				<span aria-hidden="true" className="not-italic text-accent">
					$
				</span>
				<span>{siteMeta.quip}</span>
			</p>
			<div className="flex flex-wrap items-center gap-4">
				<span
					data-testid="footer-year"
					className="text-[11px] tracking-wider text-muted/80"
				>
					© {year}
				</span>
				{repo ? (
					<a
						data-testid="footer-source"
						href={repo}
						target="_blank"
						rel="noreferrer"
						className="text-[11px] tracking-wider text-link transition-colors hover:text-accent focus-visible:outline-none focus-visible:underline"
					>
						source on github
					</a>
				) : null}
				<ThemeSwitcher />
			</div>
		</footer>
	);
}
