import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NumberTicker } from "#/components/ui/number-ticker";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { useIsMobile } from "#/hooks/use-is-mobile";
import type {
	ContributionDay,
	ContributionWeek,
	GithubGraphResponse,
} from "#/routes/api.github-graph";
import { LanguagePills } from "./language-pills";

const MOBILE_WEEKS = 13;

type FetchState =
	| { status: "loading" }
	| { status: "error" }
	| { status: "ready"; data: GithubGraphResponse };

const WEEKDAYS = [
	{ id: "sun", label: "" },
	{ id: "mon", label: "Mon" },
	{ id: "tue", label: "" },
	{ id: "wed", label: "Wed" },
	{ id: "thu", label: "" },
	{ id: "fri", label: "Fri" },
	{ id: "sat", label: "" },
] as const;
const MONTH_NAMES = [
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
] as const;
const LEGEND_STEPS = ["hm-0", "hm-1", "hm-2", "hm-3", "hm-4"] as const;
const SKELETON_WEEKS = 53;
const DAYS_PER_WEEK = 7;

const dateLabelFormat = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
});

export function GithubGraph() {
	const [state, setState] = useState<FetchState>({ status: "loading" });

	useEffect(() => {
		let cancelled = false;
		fetch("/api/github-graph")
			.then(async (res) => {
				if (!res.ok) throw new Error(`status ${res.status}`);
				return (await res.json()) as GithubGraphResponse;
			})
			.then((data) => {
				if (!cancelled) setState({ status: "ready", data });
			})
			.catch(() => {
				if (!cancelled) setState({ status: "error" });
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div
			data-testid="github-graph"
			data-state={state.status}
			className="flex flex-col gap-6"
		>
			{state.status === "ready" ? (
				<>
					<HeatmapStats data={state.data} />
					<LanguagePills languages={state.data.topLanguages} />
					<HeatmapGrid weeks={state.data.weeks} />
					<div className="flex justify-end">
						<Link
							to="/github"
							data-testid="github-see-full"
							className="font-mono text-meta text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
						>
							see full breakdown →
						</Link>
					</div>
				</>
			) : state.status === "error" ? (
				<p className="text-muted text-sm">GitHub data unavailable.</p>
			) : (
				<HeatmapSkeleton />
			)}
		</div>
	);
}

function HeatmapStats({ data }: { data: GithubGraphResponse }) {
	return (
		<dl className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
			<StatCell value={data.totalContributions} label="total" />
			<StatCell value={data.last30} label="last 30 days" />
			<StatCell value={data.activeDayPct} label="active days %" suffix="%" />
			<StatCell value={data.longestStreak} label="longest streak" />
			<StatCell value={data.currentStreak} label="current streak" />
		</dl>
	);
}

function StatCell({
	value,
	label,
	suffix,
}: {
	value: number;
	label: string;
	suffix?: string;
}) {
	return (
		<div className="rounded-card border border-border/60 bg-bg/40 px-4 py-3">
			<dd className="flex items-baseline gap-0.5">
				<NumberTicker
					value={value}
					className="font-mono text-2xl text-accent sm:text-3xl"
				/>
				{suffix ? (
					<span className="font-mono text-md text-accent/80">{suffix}</span>
				) : null}
			</dd>
			<dt className="mt-1 text-muted text-eyebrow uppercase tracking-wider">
				{label}
			</dt>
		</div>
	);
}

export function HeatmapGrid({ weeks }: { weeks: ContributionWeek[] }) {
	const isMobile = useIsMobile();
	const [focused, setFocused] = useState<ContributionDay | null>(null);
	const visibleWeeks = isMobile ? weeks.slice(-MOBILE_WEEKS) : weeks;

	const max = useMemo(() => {
		let m = 0;
		for (const w of visibleWeeks) {
			for (const d of w.days) {
				if (d.count > m) m = d.count;
			}
		}
		return m;
	}, [visibleWeeks]);

	const monthLabels = useMemo(
		() =>
			buildMonthLabels(visibleWeeks).map((label, i) => ({
				key: visibleWeeks[i]?.days[0]?.date ?? `idx-${i}`,
				label,
			})),
		[visibleWeeks],
	);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex flex-col gap-2 overflow-x-auto sm:overflow-x-auto">
				<div
					data-testid="heatmap"
					className="grid gap-2"
					style={{
						gridTemplateColumns: "auto 1fr",
					}}
				>
					<div className="grid grid-rows-7 gap-0.5 pt-5 text-muted text-meta">
						{WEEKDAYS.map((w) => (
							<span
								key={w.id}
								className="leading-none"
								aria-hidden={w.label === ""}
							>
								{w.label}
							</span>
						))}
					</div>
					<div className="flex flex-col gap-1">
						<div
							className="grid text-muted text-meta"
							style={{
								gridTemplateColumns: `repeat(${visibleWeeks.length}, minmax(0, 1fr))`,
							}}
						>
							{monthLabels.map((m) => (
								<span
									key={m.key}
									className="leading-none"
									aria-hidden={m.label === ""}
								>
									{m.label}
								</span>
							))}
						</div>
						<div
							className="grid grid-flow-col grid-rows-7 gap-0.5"
							style={{
								gridAutoColumns: "minmax(0, 1fr)",
							}}
						>
							{visibleWeeks.flatMap((w) =>
								w.days.map((d) => (
									<HeatmapCell
										key={d.date}
										day={d}
										max={max}
										onFocus={() => setFocused(d)}
									/>
								)),
							)}
						</div>
					</div>
				</div>
				{/* Live caption — touch users can't hover; tap a cell to read its date + count here. */}
				<p
					data-testid="heatmap-caption"
					aria-live="polite"
					className="min-h-5 text-meta text-muted sm:hidden"
				>
					{focused ? describeDay(focused) : "tap a cell to inspect"}
				</p>
				<HeatmapLegend />
			</div>
		</TooltipProvider>
	);
}

function HeatmapCell({
	day,
	max,
	onFocus,
}: {
	day: ContributionDay;
	max: number;
	onFocus?: () => void;
}) {
	const label = describeDay(day);
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label={label}
					data-count={day.count}
					data-date={day.date}
					onFocus={onFocus}
					onClick={onFocus}
					className={`size-3 rounded-chip ${intensityClass(day.count, max)}`}
				/>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

function HeatmapLegend() {
	return (
		<div className="flex items-center gap-2 self-end text-muted text-meta">
			<span>Less</span>
			{LEGEND_STEPS.map((step) => (
				<span
					key={step}
					data-testid={`legend-${step}`}
					className={`inline-block size-3 rounded-chip ${step}`}
					aria-hidden
				/>
			))}
			<span>More</span>
		</div>
	);
}

const SKELETON_KEYS = Array.from(
	{ length: SKELETON_WEEKS * DAYS_PER_WEEK },
	(_, i) => `skel-${i}`,
);

function HeatmapSkeleton() {
	return (
		<div
			data-testid="heatmap-skeleton"
			className="grid grid-flow-col grid-rows-7 gap-0.5"
			style={{ gridAutoColumns: "minmax(0, 1fr)" }}
		>
			{SKELETON_KEYS.map((key) => (
				<div
					key={key}
					className="size-3 animate-pulse rounded-chip bg-border/30"
				/>
			))}
		</div>
	);
}

export function intensityClass(count: number, max: number): string {
	if (count <= 0 || max <= 0) return "hm-0";
	const idx = Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
	return `hm-${idx}`;
}

function describeDay(d: ContributionDay): string {
	const noun = d.count === 1 ? "contribution" : "contributions";
	return `${d.count} ${noun} on ${dateLabelFormat.format(new Date(`${d.date}T00:00:00Z`))}`;
}

function buildMonthLabels(weeks: ContributionWeek[]): string[] {
	const labels: string[] = [];
	let lastMonth = -1;
	for (const w of weeks) {
		const first = w.days[0];
		if (!first) {
			labels.push("");
			continue;
		}
		const m = new Date(`${first.date}T00:00:00Z`).getUTCMonth();
		if (m !== lastMonth) {
			labels.push(MONTH_NAMES[m]);
			lastMonth = m;
		} else {
			labels.push("");
		}
	}
	return labels;
}
