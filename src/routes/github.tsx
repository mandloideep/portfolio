import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeatmapGrid } from "#/components/portfolio/github-graph";
import { LanguagePills } from "#/components/portfolio/language-pills";
import { PortfolioLayout } from "#/components/portfolio/portfolio-layout";
import { TopRepos } from "#/components/portfolio/top-repos";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { StatCard } from "#/components/ui/stat-card";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";
import type { GithubGraphResponse } from "./api.github-graph";

const TITLE = `${siteMeta.name} — github stats`;
const DESCRIPTION =
	"Live GitHub stats: contributions, languages, top repos, PR + issue activity.";

export const Route = createFileRoute("/github")({
	component: GithubRoute,
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			...buildOpenGraphMeta({
				title: TITLE,
				description: DESCRIPTION,
				path: "/github",
				siteMeta,
				ogImage: "/og/github.png",
			}),
		],
	}),
});

type FetchState =
	| { status: "loading" }
	| { status: "error" }
	| { status: "ready"; data: GithubGraphResponse };

function GithubRoute() {
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
		<PortfolioLayout>
			<section
				data-testid="github-stats"
				data-state={state.status}
				className="flex flex-col gap-10 px-6 py-10 sm:px-10 sm:py-12"
			>
				<CommandPrompt command="gh stats --pretty" />

				{state.status === "loading" ? (
					<p className="text-muted">loading stats…</p>
				) : state.status === "error" ? (
					<p className="text-muted">github data unavailable.</p>
				) : (
					<>
						<HeadlineStats data={state.data} />

						<section className="flex flex-col gap-3">
							<h2 className="font-mono text-md uppercase tracking-tab text-muted">
								languages
							</h2>
							<LanguagePills languages={state.data.topLanguages} showBars />
						</section>

						<section className="flex flex-col gap-3">
							<h2 className="font-mono text-md uppercase tracking-tab text-muted">
								top repos
							</h2>
							<TopRepos repos={state.data.topRepos} />
						</section>

						<section className="flex flex-col gap-3">
							<h2 className="font-mono text-md uppercase tracking-tab text-muted">
								contribution heatmap
							</h2>
							<HeatmapGrid weeks={state.data.weeks} />
						</section>
					</>
				)}
			</section>
		</PortfolioLayout>
	);
}

function HeadlineStats({ data }: { data: GithubGraphResponse }) {
	const cells: Array<{ value: string; label: string }> = [
		{ value: fmt(data.totalContributions), label: "total contributions" },
		{ value: fmt(data.last30), label: "last 30 days" },
		{ value: fmt(data.last7), label: "last 7 days" },
		{ value: `${data.activeDayPct}%`, label: "active days" },
		{ value: fmt(data.longestStreak), label: "longest streak" },
		{ value: fmt(data.currentStreak), label: "current streak" },
		{ value: fmt(data.publicRepoCount), label: "public repos" },
		{ value: fmt(data.totalStars), label: "total stars" },
		{ value: fmt(data.prs.merged), label: "PRs merged" },
		{ value: fmt(data.issuesOpened), label: "issues opened" },
	];
	const sub: Array<{ value: string; label: string; sublabel?: string }> = [
		{
			value: fmt(data.bestDay.count),
			label: "best day",
			sublabel: data.bestDay.date || undefined,
		},
		{
			value: fmt(data.bestWeek.count),
			label: "best week",
			sublabel: data.bestWeek.weekStart
				? `from ${data.bestWeek.weekStart}`
				: undefined,
		},
		{
			value: data.topWeekday.name,
			label: "top weekday",
			sublabel: `avg ${data.topWeekday.mean.toFixed(1)} / day`,
		},
		{ value: fmt(data.prs.opened), label: "PRs opened" },
	];
	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{cells.map((c) => (
					<StatCard key={c.label} value={c.value} label={c.label} />
				))}
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{sub.map((c) => (
					<StatCard
						key={c.label}
						value={c.value}
						label={c.label}
						sublabel={c.sublabel}
					/>
				))}
			</div>
		</div>
	);
}

function fmt(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}
