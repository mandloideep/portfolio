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
			className="relative pl-8 pb-10 last:pb-0 md:pl-10"
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
				)}
			/>

			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
					<div className="flex flex-col">
						<h3 className="text-base font-medium tracking-tight text-fg md:text-lg">
							{entry.role}
						</h3>
						<span className="text-sm text-fg/70">{entry.company}</span>
					</div>
					<span
						data-testid={`experience-dates-${index}`}
						className="shrink-0 font-mono text-xs text-muted md:text-sm"
					>
						{formatRange(entry.start, entry.end)}
					</span>
				</div>

				<ul className="flex flex-col gap-1.5 text-sm text-fg/80">
					{entry.bullets.map((bullet) => (
						<li key={bullet} className="flex gap-2">
							<span aria-hidden="true" className="shrink-0 text-accent">
								▸
							</span>
							<span>{bullet}</span>
						</li>
					))}
				</ul>

				{entry.tags.length > 0 ? (
					<div className="flex flex-wrap items-center gap-2 pt-1">
						{entry.tags.map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="border-border/70 text-fg/70"
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
