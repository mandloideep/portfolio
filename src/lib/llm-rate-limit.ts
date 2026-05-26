import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "#/db";
import { llmCallLog } from "#/db/schema";
import type { Provider } from "#/lib/openrouter";

export type ModelQuota = { rpm: number; rpd: number };

/**
 * Free-tier ceilings for the models we ship. Each entry is the *raw* Google
 * limit; we apply a configurable soft cap (default 90%) so we refuse a call
 * before Google would 429 us.
 */
export const MODEL_QUOTAS: Record<string, ModelQuota> = {
	"gemma-4-31b-it": { rpm: 15, rpd: 1500 },
	"gemma-4-26b-a4b-it": { rpm: 15, rpd: 1500 },
	"gemini-2.5-flash-lite": { rpm: 10, rpd: 20 },
	// OpenRouter free-tier nemotron used for the classifier. The actual
	// limit depends on the account's lifetime credit purchase (50/day
	// without credits, 1000/day with $10+). We pick a conservative middle
	// number; if OR returns 429 we fail-open via the catch block below.
	"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": {
		rpm: 20,
		rpd: 200,
	},
};

export type LlmRateCheckArgs = {
	provider: Provider;
	model: string;
	/** Reject when usage exceeds `softCapPct * ceiling`. Default 0.9. */
	softCapPct?: number;
};

export type LlmRateResult =
	| { allowed: true }
	| { allowed: false; reason: "rpm" | "rpd"; retryAfterMs: number };

/**
 * Atomically check + record an LLM call for the given (provider, model).
 * Counts the last 60 seconds and the current UTC date from `llm_call_log`,
 * inserts a row when admission passes, and computes `retryAfterMs` for
 * client display when rejected.
 *
 * On any storage failure we fail-open (`allowed: true`) so a Postgres blip
 * doesn't black-hole the agent.
 */
export async function checkAndRecordLlmCall(
	args: LlmRateCheckArgs,
): Promise<LlmRateResult> {
	const quota = MODEL_QUOTAS[args.model];
	if (!quota) {
		// Unknown model — we don't gate it. The catalog allowlist upstream
		// should have caught anything truly unexpected.
		return { allowed: true };
	}
	const softCapPct = args.softCapPct ?? 0.9;
	const rpmCap = Math.max(1, Math.floor(quota.rpm * softCapPct));
	const rpdCap = Math.max(1, Math.floor(quota.rpd * softCapPct));

	const now = new Date();
	const minuteAgo = new Date(now.getTime() - 60_000);
	const dayStart = startOfUtcDay(now);

	try {
		const [rpmRows, rpdRows] = await Promise.all([
			db
				.select({ ts: llmCallLog.calledAt })
				.from(llmCallLog)
				.where(
					and(
						eq(llmCallLog.provider, args.provider),
						eq(llmCallLog.model, args.model),
						gte(llmCallLog.calledAt, minuteAgo),
					),
				),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(llmCallLog)
				.where(
					and(
						eq(llmCallLog.provider, args.provider),
						eq(llmCallLog.model, args.model),
						gte(llmCallLog.calledAt, dayStart),
					),
				),
		]);

		const rpmUsed = rpmRows.length;
		const rpdUsed = rpdRows[0]?.count ?? 0;

		if (rpdUsed >= rpdCap) {
			return {
				allowed: false,
				reason: "rpd",
				retryAfterMs: nextUtcMidnight(now).getTime() - now.getTime(),
			};
		}
		if (rpmUsed >= rpmCap) {
			// Retry when the oldest row in the 60s window expires.
			const oldest = rpmRows
				.map((r) => new Date(r.ts).getTime())
				.sort((a, b) => a - b)[0];
			const retryAfterMs = oldest
				? Math.max(0, oldest + 60_000 - now.getTime()) + 250
				: 60_000;
			return { allowed: false, reason: "rpm", retryAfterMs };
		}

		await db
			.insert(llmCallLog)
			.values({ provider: args.provider, model: args.model, calledAt: now });

		// Best-effort prune: keep the table bounded. Drop rows older than
		// ~26 hours so the per-day window is always covered. Run ~1% of the
		// time to avoid making admission slower.
		if (Math.random() < 0.01) {
			const cutoff = new Date(now.getTime() - 26 * 60 * 60_000);
			db.delete(llmCallLog)
				.where(sql`${llmCallLog.calledAt} < ${cutoff}`)
				.catch(() => {});
		}

		return { allowed: true };
	} catch {
		return { allowed: true };
	}
}

function startOfUtcDay(d: Date): Date {
	const out = new Date(d);
	out.setUTCHours(0, 0, 0, 0);
	return out;
}

function nextUtcMidnight(d: Date): Date {
	const out = new Date(d);
	out.setUTCHours(24, 0, 0, 0);
	return out;
}
