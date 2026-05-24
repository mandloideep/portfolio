import { useEffect, useMemo, useState } from "react";
import { NumberTicker } from "#/components/ui/number-ticker";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type {
	ContributionDay,
	ContributionWeek,
	GithubGraphResponse,
} from "#/routes/api.github-graph";

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
					<HeatmapStats
						total={state.data.totalContributions}
						longest={state.data.longestStreak}
						current={state.data.currentStreak}
					/>
					<HeatmapGrid weeks={state.data.weeks} />
				</>
			) : state.status === "error" ? (
				<p className="text-muted text-sm">GitHub data unavailable.</p>
			) : (
				<HeatmapSkeleton />
			)}
		</div>
	);
}

function HeatmapStats({
	total,
	longest,
	current,
}: {
	total: number;
	longest: number;
	current: number;
}) {
	return (
		<dl className="grid grid-cols-3 gap-4">
			<StatCell value={total} label="total contributions" />
			<StatCell value={longest} label="longest streak" />
			<StatCell value={current} label="current streak" />
		</dl>
	);
}

function StatCell({ value, label }: { value: number; label: string }) {
	return (
		<div className="rounded-md border border-border/60 bg-bg/40 px-4 py-3">
			<dd>
				<NumberTicker
					value={value}
					className="font-mono text-3xl text-accent"
				/>
			</dd>
			<dt className="mt-1 text-muted text-xs uppercase tracking-wider">
				{label}
			</dt>
		</div>
	);
}

function HeatmapGrid({ weeks }: { weeks: ContributionWeek[] }) {
	const max = useMemo(() => {
		let m = 0;
		for (const w of weeks) {
			for (const d of w.days) {
				if (d.count > m) m = d.count;
			}
		}
		return m;
	}, [weeks]);

	const monthLabels = useMemo(
		() =>
			buildMonthLabels(weeks).map((label, i) => ({
				key: weeks[i]?.days[0]?.date ?? `idx-${i}`,
				label,
			})),
		[weeks],
	);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex flex-col gap-2 overflow-x-auto">
				<div
					data-testid="heatmap"
					className="grid gap-2"
					style={{
						gridTemplateColumns: "auto 1fr",
					}}
				>
					<div className="grid grid-rows-7 gap-[3px] pt-5 text-muted text-[10px]">
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
							className="grid text-muted text-[10px]"
							style={{
								gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
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
							className="grid grid-flow-col grid-rows-7 gap-[3px]"
							style={{
								gridAutoColumns: "minmax(0, 1fr)",
							}}
						>
							{weeks.flatMap((w) =>
								w.days.map((d) => (
									<HeatmapCell key={d.date} day={d} max={max} />
								)),
							)}
						</div>
					</div>
				</div>
				<HeatmapLegend />
			</div>
		</TooltipProvider>
	);
}

function HeatmapCell({ day, max }: { day: ContributionDay; max: number }) {
	const label = describeDay(day);
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label={label}
					data-count={day.count}
					data-date={day.date}
					className={`size-3 rounded-[2px] ${intensityClass(day.count, max)}`}
				/>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

function HeatmapLegend() {
	return (
		<div className="flex items-center gap-2 self-end text-muted text-xs">
			<span>Less</span>
			{LEGEND_STEPS.map((step) => (
				<span
					key={step}
					data-testid={`legend-${step}`}
					className={`inline-block size-3 rounded-[2px] ${step}`}
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
			className="grid grid-flow-col grid-rows-7 gap-[3px]"
			style={{ gridAutoColumns: "minmax(0, 1fr)" }}
		>
			{SKELETON_KEYS.map((key) => (
				<div
					key={key}
					className="size-3 animate-pulse rounded-[2px] bg-border/30"
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
