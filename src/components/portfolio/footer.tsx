import { getProject } from "#/content/site";
import { useQuip } from "#/hooks/use-quip";

/**
 * Terminal-prompt footer line: `$ <quip>`. Trails with year + source link
 * on the right. Theme + density controls live on the chrome top bar, not
 * here (see PortfolioLayout).
 */
export function Footer() {
	const repo = getProject("agent-portfolio")?.links.repo;
	const year = new Date().getFullYear();
	const quip = useQuip();

	return (
		<footer
			data-testid="portfolio-footer"
			className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-5 font-mono text-sm text-muted sm:px-10"
		>
			<p data-testid="footer-quip" className="flex items-baseline gap-2 italic">
				<span aria-hidden="true" className="not-italic text-accent">
					$
				</span>
				<span>{quip}</span>
			</p>
			<div className="flex flex-wrap items-center gap-4">
				<span
					data-testid="footer-year"
					className="text-meta tracking-wide text-muted/80"
				>
					© {year}
				</span>
				{repo ? (
					<a
						data-testid="footer-source"
						href={repo}
						target="_blank"
						rel="noreferrer"
						className="text-meta tracking-wide text-link transition-colors duration-base hover:text-accent focus-visible:outline-none focus-visible:underline"
					>
						source on github
					</a>
				) : null}
			</div>
		</footer>
	);
}
