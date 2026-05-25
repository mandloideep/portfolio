import type { Experience } from "#/content/site";
import { cn } from "#/lib/utils";

export interface ExperienceCardProps {
	entry: Experience;
	index: number;
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

export function ExperienceCard({ entry, index }: ExperienceCardProps) {
	const isCurrent = entry.end === "present";

	return (
		<li
			data-testid={`experience-card-${index}`}
			className={cn(
				"rounded-md border bg-bg-elev/50 px-5 py-4",
				isCurrent
					? "border-accent/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_25%,transparent)]"
					: "border-border/70",
			)}
		>
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<div className="flex items-baseline gap-2">
					<span aria-hidden="true" className="select-none text-accent">
						›
					</span>
					<h3 className="font-mono text-[14px] text-fg">{entry.company}</h3>
				</div>
				<span
					data-testid={`experience-dates-${index}`}
					className="shrink-0 font-mono text-[11px] tracking-wider text-muted [font-variant-numeric:tabular-nums]"
				>
					{formatRange(entry.start, entry.end)}
				</span>
			</div>
			<div className="mt-0.5 font-mono text-[12.5px] text-link">
				{entry.role}
			</div>

			<ul className="mt-3 flex flex-col gap-1.5 font-mono text-[12.5px] leading-[1.6] text-fg/85">
				{entry.bullets.map((bullet) => (
					<li key={bullet} className="flex gap-2">
						<span
							aria-hidden="true"
							className="shrink-0 select-none text-accent"
						>
							→
						</span>
						<span>{bullet}</span>
					</li>
				))}
			</ul>

			{entry.tags.length > 0 ? (
				<div className="mt-3 flex flex-wrap items-center gap-1.5">
					{entry.tags.map((tag) => (
						<span
							key={tag}
							data-slot="badge"
							className="inline-flex items-center rounded-sm border border-border/70 bg-bg/40 px-2 py-0.5 font-mono text-[10.5px] text-fg/80"
						>
							{tag}
						</span>
					))}
				</div>
			) : null}
		</li>
	);
}
