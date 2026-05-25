import { useEffect, useRef, useState } from "react";
import type { Experience } from "#/content/site";
import { useReducedMotion } from "#/hooks/use-reduced-motion";
import { cn } from "#/lib/utils";
import { Badge } from "../ui/badge";

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
	const reduced = useReducedMotion();
	const dotRef = useRef<HTMLSpanElement | null>(null);
	const [inView, setInView] = useState(false);
	const isCurrent = entry.end === "present";

	useEffect(() => {
		const el = dotRef.current;
		if (!el || typeof IntersectionObserver === "undefined") return;
		const io = new IntersectionObserver(
			(entries) => {
				const e = entries[0];
				if (e?.isIntersecting) setInView(true);
			},
			{ threshold: 0.5 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	const animated = reduced || inView;

	return (
		<li
			data-testid={`experience-card-${index}`}
			className="relative pl-8 pb-12 last:pb-0 md:pl-10"
		>
			<span
				ref={dotRef}
				data-testid={`experience-dot-${index}`}
				data-reduced={reduced ? "true" : "false"}
				data-in-view={inView ? "true" : "false"}
				aria-hidden="true"
				className={cn(
					"absolute left-0 top-2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-accent bg-bg",
					"transition-all duration-500 ease-out",
					animated ? "scale-100 opacity-100" : "scale-50 opacity-0",
					isCurrent &&
						"after:absolute after:inset-[-6px] after:rounded-full after:border after:border-accent/40 after:animate-[status-pulse_1.6s_ease-in-out_infinite]",
				)}
			/>

			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<div className="flex flex-col">
						<h3 className="font-display text-[1.35rem] font-medium leading-[1.1] tracking-tight text-fg md:text-[1.55rem]">
							{entry.company}
						</h3>
						<span className="text-[0.95rem] text-fg/85">{entry.role}</span>
					</div>
					<span
						data-testid={`experience-dates-${index}`}
						className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted [font-variant-numeric:tabular-nums] md:text-xs"
					>
						{formatRange(entry.start, entry.end)}
					</span>
				</div>

				<ul className="flex flex-col gap-2 text-[0.95rem] leading-[1.6] text-fg/90">
					{entry.bullets.map((bullet) => (
						<li key={bullet} className="flex gap-2.5">
							<span
								aria-hidden="true"
								className="shrink-0 select-none pt-1 text-accent"
							>
								▸
							</span>
							<span>{bullet}</span>
						</li>
					))}
				</ul>

				{entry.tags.length > 0 ? (
					<div className="flex flex-wrap items-center gap-1.5 pt-1">
						{entry.tags.map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="border-border/70 bg-bg/40 font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg/80"
							>
								{tag}
							</Badge>
						))}
					</div>
				) : null}
			</div>
		</li>
	);
}
