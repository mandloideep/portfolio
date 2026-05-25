import { useId, useState } from "react";
import type { Experience } from "#/content/site";
import { cn } from "#/lib/utils";

export interface ExperienceCardProps {
	entry: Experience;
	index: number;
	defaultExpanded?: boolean;
}

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function formatYearMonth(token: string): string {
	if (token === "present") return "Present";
	const [yearStr, monthStr] = token.split("-");
	const year = Number(yearStr);
	const month = Number(monthStr);
	if (
		!Number.isFinite(year) ||
		!Number.isFinite(month) ||
		month < 1 ||
		month > 12
	) {
		return token;
	}
	return `${MONTHS[month - 1]} ${year}`;
}

function formatRange(start: string, end: string): string {
	return `${formatYearMonth(start)} – ${formatYearMonth(end)}`;
}

/**
 * Collapsible experience entry. Header shows role + tag chips + date
 * range; body (bullets + summary tags) is hidden until expanded. The
 * currently-active job (end="present") and the first entry on the page
 * default to expanded — controlled by the parent via `defaultExpanded`.
 */
export function ExperienceCard({
	entry,
	index,
	defaultExpanded,
}: ExperienceCardProps) {
	const isCurrent = entry.end === "present";
	const [expanded, setExpanded] = useState(defaultExpanded ?? false);
	const panelId = useId();

	return (
		<li
			data-testid={`experience-card-${index}`}
			data-expanded={expanded ? "true" : "false"}
			className={cn(
				"rounded-md border bg-bg-elev/50 transition-colors",
				expanded
					? "border-accent/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_25%,transparent)]"
					: "border-border/70 hover:border-border",
			)}
		>
			<button
				type="button"
				data-testid={`experience-toggle-${index}`}
				onClick={() => setExpanded((v) => !v)}
				aria-expanded={expanded}
				aria-controls={panelId}
				className="flex w-full flex-col gap-1 rounded-md px-5 py-4 text-left font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<div className="flex flex-wrap items-center gap-2.5">
						<h3 className="text-[15px] text-accent">{entry.role}</h3>
						<div className="flex flex-wrap items-center gap-1.5">
							{entry.tags.map((tag) => (
								<span
									key={tag}
									data-slot="badge"
									className="inline-flex items-center rounded-sm border border-border/70 bg-bg/40 px-1.5 py-0.5 text-[10.5px] text-fg/80"
								>
									{tag}
								</span>
							))}
						</div>
					</div>
					<span
						data-testid={`experience-dates-${index}`}
						className="shrink-0 text-[12px] tracking-wider text-muted [font-variant-numeric:tabular-nums]"
					>
						{formatRange(entry.start, entry.end)}
					</span>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="text-[13px] text-link">{entry.company}</div>
					<span aria-hidden="true" className="text-[11px] text-muted">
						{expanded ? "▼ click to collapse" : "▶ click to expand"}
					</span>
				</div>
			</button>

			{expanded ? (
				<div
					id={panelId}
					className="border-t border-border/60 px-5 py-5 sm:px-7 sm:py-6"
				>
					<ul className="flex flex-col gap-2.5 font-mono text-[13.5px] leading-[1.65] text-fg/90">
						{entry.bullets.map((bullet) => (
							<li key={bullet} className="flex gap-2.5">
								<span
									aria-hidden="true"
									className="shrink-0 select-none pt-0.5 text-accent"
								>
									→
								</span>
								<span>{bullet}</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
			{isCurrent ? (
				<span data-testid={`experience-current-${index}`} className="sr-only">
					current role
				</span>
			) : null}
		</li>
	);
}
