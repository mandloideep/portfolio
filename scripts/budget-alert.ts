/**
 * Daily-budget alert.
 *
 * Queries today's UTC `agent_usage_daily` row and posts a Discord/Slack
 * webhook when tokens crossed 80% of DAILY_TOKEN_BUDGET. No-op when the
 * webhook URL is unset.
 *
 * Intended to run from Dokploy → Scheduled Tasks every ~30 minutes:
 *
 *   pnpm budget:alert
 *
 * Exits 0 in all non-error paths so a scheduler doesn't flap on a quiet day.
 */

import { eq } from "drizzle-orm";
import { db } from "#/db";
import { agentUsageDaily } from "#/db/schema";
import { getServerEnv } from "#/lib/env";
import { logger } from "#/lib/logger";

const ALERT_THRESHOLD = 0.8;

async function main(): Promise<void> {
	const env = getServerEnv();
	const webhook = env.BUDGET_ALERT_WEBHOOK_URL;
	if (!webhook) {
		logger.info("BUDGET_ALERT_WEBHOOK_URL unset; skipping alert.");
		return;
	}

	const today = new Date().toISOString().slice(0, 10);
	const rows = await db
		.select()
		.from(agentUsageDaily)
		.where(eq(agentUsageDaily.day, today))
		.limit(1);
	const used = rows[0]?.tokens ?? 0;
	const requests = rows[0]?.requests ?? 0;
	const budget = env.DAILY_TOKEN_BUDGET;
	const pct = used / budget;

	if (pct < ALERT_THRESHOLD) {
		logger.info(
			{ used, budget, pct: Number(pct.toFixed(3)), requests },
			"budget OK; no alert",
		);
		return;
	}

	const message =
		pct >= 1
			? `:rotating_light: Daily token budget exhausted (${used.toLocaleString()} / ${budget.toLocaleString()}, ${requests} requests). All chat traffic now blocked until UTC midnight.`
			: `:warning: Daily token budget at ${Math.round(pct * 100)}% (${used.toLocaleString()} / ${budget.toLocaleString()}, ${requests} requests).`;

	const res = await fetch(webhook, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ content: message, text: message }),
	});
	if (!res.ok) {
		logger.error(
			{ status: res.status, used, budget },
			"budget alert webhook failed",
		);
		process.exitCode = 1;
		return;
	}
	logger.info({ used, budget, pct: Number(pct.toFixed(3)) }, "budget alert sent");
}

main().catch((err) => {
	logger.error({ err }, "budget-alert crashed");
	process.exitCode = 1;
});
