import type { GithubGraphResponse } from "#/routes/api.github-graph";

const WIDTH = 60;
const TOP = `╭${"─".repeat(WIDTH - 2)}╮`;
const MID = `├${"─".repeat(WIDTH - 2)}┤`;
const BOT = `╰${"─".repeat(WIDTH - 2)}╯`;

/**
 * Render the GitHub stats as a deterministic unicode box. The output is
 * wrapped in a fenced code block so the markdown renderer preserves
 * whitespace and uses a monospace font.
 */
export function renderStatsTable(data: GithubGraphResponse): string {
	const lines: string[] = [];
	lines.push(TOP);
	lines.push(row("GITHUB STATS"));
	lines.push(MID);

	// Headline numbers — two-column "label  value" pairs.
	lines.push(twoCol("total contributions", fmt(data.totalContributions)));
	lines.push(twoCol("last 30 days", fmt(data.last30)));
	lines.push(twoCol("last 7 days", fmt(data.last7)));
	lines.push(twoCol("active days", `${data.activeDayPct}%`));
	lines.push(twoCol("longest streak", `${data.longestStreak} days`));
	lines.push(twoCol("current streak", `${data.currentStreak} days`));
	lines.push(twoCol("public repos", fmt(data.publicRepoCount)));
	lines.push(twoCol("total stars", fmt(data.totalStars)));
	lines.push(twoCol("PRs merged", fmt(data.prs.merged)));
	lines.push(twoCol("issues opened", fmt(data.issuesOpened)));
	lines.push(
		twoCol("best day", `${data.bestDay.count} on ${data.bestDay.date}`),
	);
	lines.push(
		twoCol(
			"top weekday",
			`${data.topWeekday.name} (avg ${data.topWeekday.mean.toFixed(1)})`,
		),
	);

	if (data.topLanguages.length > 0) {
		lines.push(MID);
		lines.push(row("LANGUAGES"));
		lines.push(MID);
		for (const lang of data.topLanguages) {
			lines.push(langRow(lang.name, lang.pct));
		}
	}

	if (data.topRepos.length > 0) {
		lines.push(MID);
		lines.push(row("TOP REPOS"));
		lines.push(MID);
		for (const repo of data.topRepos.slice(0, 3)) {
			lines.push(twoCol(repo.name, `★ ${repo.stars}`));
		}
	}

	lines.push(BOT);
	return ["```", ...lines, "```"].join("\n");
}

function row(text: string): string {
	const padded = pad(text, WIDTH - 4);
	return `│ ${padded} │`;
}

function twoCol(label: string, value: string): string {
	const labelWidth = Math.floor((WIDTH - 4) * 0.55);
	const valueWidth = WIDTH - 4 - labelWidth - 1;
	const l = pad(label, labelWidth);
	const v = padLeft(value, valueWidth);
	return `│ ${l} ${v} │`;
}

function langRow(name: string, pct: number): string {
	// 24 cell-wide bar with a percentage on the right.
	const barWidth = 24;
	const filled = Math.round((Math.min(100, pct) / 100) * barWidth);
	const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
	const left = pad(name, WIDTH - 4 - barWidth - 8);
	const right = padLeft(`${pct.toFixed(1)}%`, 6);
	return `│ ${left} ${bar} ${right} │`;
}

function pad(s: string, width: number): string {
	const trimmed = truncate(s, width);
	return trimmed + " ".repeat(Math.max(0, width - trimmed.length));
}

function padLeft(s: string, width: number): string {
	const trimmed = truncate(s, width);
	return " ".repeat(Math.max(0, width - trimmed.length)) + trimmed;
}

function truncate(s: string, max: number): string {
	if (s.length <= max) return s;
	return `${s.slice(0, Math.max(0, max - 1))}…`;
}

function fmt(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}
