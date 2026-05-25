import { useId, useState } from "react";
import { Card } from "#/components/ui/card";
import { Pill } from "#/components/ui/pill";
import { TechIcon } from "#/components/ui/tech-icon";
import type { Experience } from "#/content/site";

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
 * range; body (bullets) hidden until expanded. Current role (end="present")
 * gets the accent glow and auto-expands.
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
		<Card
			as="li"
			tone={isCurrent ? "accent" : "default"}
			data-testid={`experience-card-${index}`}
			data-expanded={expanded ? "true" : "false"}
			data-current={isCurrent ? "true" : "false"}
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
						<h3 className="text-md text-accent">{entry.role}</h3>
						<div className="flex flex-wrap items-center gap-1.5">
							{entry.tags.map((tag) => (
								<Pill key={tag} size="xs" className="gap-1.5">
									<TechIcon label={tag} className="size-3 text-fg/70" />
									{tag}
								</Pill>
							))}
						</div>
					</div>
					<span
						data-testid={`experience-dates-${index}`}
						className="shrink-0 text-meta tracking-wide text-muted [font-variant-numeric:tabular-nums]"
					>
						{formatRange(entry.start, entry.end)}
					</span>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="text-sm text-link">{entry.company}</div>
					<span aria-hidden="true" className="text-meta text-muted">
						{expanded ? "▼ click to collapse" : "▶ click to expand"}
					</span>
				</div>
			</button>

			{expanded ? (
				<div
					id={panelId}
					className="border-t border-border/60 px-5 py-5 sm:px-7 sm:py-6"
				>
					<ul className="flex flex-col gap-2.5 font-mono text-base leading-relaxed text-fg/90">
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
		</Card>
	);
}
