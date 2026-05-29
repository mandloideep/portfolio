import { ExternalLink, Star } from "lucide-react";
import { Card } from "#/components/ui/card";
import type { TopRepo } from "#/routes/api.github-graph";

type Props = { repos: TopRepo[] };

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/**
 * Vertical list of the user's top repos by stars. Each card surfaces:
 * name + stars on the left, primary language pill + relative pushed-at on
 * the right, and description below.
 */
export function TopRepos({ repos }: Props) {
	if (repos.length === 0) {
		return <p className="text-muted text-sm">no public repos to show.</p>;
	}
	return (
		<ul data-testid="top-repos" className="flex flex-col gap-3">
			{repos.map((r) => (
				<li key={r.name}>
					<Card
						as="a"
						interactive
						href={r.url}
						target="_blank"
						rel="noreferrer"
						data-testid={`repo-${r.name}`}
						className="flex flex-col gap-2 p-4"
					>
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<div className="flex items-center gap-2 font-mono text-md">
								<span className="text-accent">{r.name}</span>
								<ExternalLink
									aria-hidden="true"
									className="size-3 text-muted/70"
								/>
							</div>
							<div className="flex items-center gap-3 font-mono text-meta text-muted [font-variant-numeric:tabular-nums]">
								<span className="inline-flex items-center gap-1">
									<Star aria-hidden="true" className="size-3 text-accent-alt" />
									{r.stars}
								</span>
								<span aria-hidden="true">·</span>
								<span>pushed {relativeFromNow(r.pushedAt)}</span>
								{r.primaryLanguage ? (
									<>
										<span aria-hidden="true">·</span>
										<span className="inline-flex items-center gap-1.5">
											<span
												aria-hidden="true"
												className="inline-block size-2.5 rounded-pill"
												style={{
													background:
														r.primaryLanguage.color ?? "var(--accent)",
												}}
											/>
											{r.primaryLanguage.name}
										</span>
									</>
								) : null}
							</div>
						</div>
						{r.description ? (
							<p className="font-mono text-sm text-fg/80">{r.description}</p>
						) : null}
					</Card>
				</li>
			))}
		</ul>
	);
}

function relativeFromNow(iso: string): string {
	const then = new Date(iso).getTime();
	if (!Number.isFinite(then)) return "—";
	const deltaSec = Math.round((then - Date.now()) / 1000);
	const absSec = Math.abs(deltaSec);
	const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
		["year", 60 * 60 * 24 * 365],
		["month", 60 * 60 * 24 * 30],
		["week", 60 * 60 * 24 * 7],
		["day", 60 * 60 * 24],
		["hour", 60 * 60],
		["minute", 60],
	];
	for (const [unit, secsPer] of units) {
		if (absSec >= secsPer) {
			return RELATIVE.format(Math.round(deltaSec / secsPer), unit);
		}
	}
	return RELATIVE.format(deltaSec, "second");
}
