import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "#/db";
import { agentRateLimits, agentUsageDaily } from "#/db/schema";
import { logger } from "#/lib/logger";

export type PrivacyVerdict = {
	country?: string;
	asn?: string;
	blocked: boolean;
	reason?: "vpn" | "proxy" | "hosting" | "tor";
};

export type RateCheck = {
	allowed: boolean;
	/**
	 * Number of messages remaining inside the window. For free models with
	 * `freeIpLimit === 0`, the count is uncapped and `remaining` is `null`
	 * (the SSE serializer emits `null`; status footers render `∞`).
	 */
	remaining: number | null;
	resetsAt: Date;
	/** True when no per-IP message count applies (free + unlimited). */
	unlimited: boolean;
	tier: "free" | "premium";
	blockedReason?: string;
};

export type RateCheckArgs = {
	ipHash: string;
	tier: "free" | "premium";
	/**
	 * Per-IP cap for premium models (only consulted when tier === "premium").
	 */
	premiumLimit: number;
	/**
	 * Per-IP daily cap for free models. `0` = unlimited (only the shared
	 * model RPM/RPD apply); `> 0` enforces a per-visitor count. The cap is
	 * shared across all free models so a visitor can't multiply their
	 * budget by switching slugs.
	 */
	freeIpLimit: number;
	windowMs: number;
	cooldownMs: number;
	perIpTokenBudget: number;
	/**
	 * Called only on the *first* request from a new ipHash. Returns the
	 * privacy verdict from IPInfo (or wherever). If omitted, no privacy
	 * check happens — useful for tests and for disabling the feature.
	 */
	lookupPrivacy?: () => Promise<PrivacyVerdict>;
};

/**
 * Read the client IP from common reverse-proxy headers, in order of
 * trustworthiness. Falls back to `"unknown"` so callers always get a hashable
 * string. The "unknown" bucket effectively rate-limits anonymous access too,
 * which is the conservative default.
 */
export function getClientIp(request: Request): string {
	const cf = request.headers.get("cf-connecting-ip");
	if (cf) return cf.trim();
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	const xr = request.headers.get("x-real-ip");
	if (xr) return xr.trim();
	return "unknown";
}

/** sha256(ip + salt) → base64url. */
export function hashIp(ip: string, salt: string): string {
	return createHash("sha256").update(`${salt}:${ip}`).digest("base64url");
}

/**
 * The composite rate-limit check. Atomically:
 *   • upserts the row,
 *   • rolls the window if it elapsed,
 *   • enforces the cooldown,
 *   • enforces the per-IP token budget,
 *   • enforces the message count limit.
 *
 * Returns `allowed: false` with a specific `blockedReason` when any rule
 * rejects. The cooldown check is intentionally last so legitimate users
 * can see "you have N left" rather than "wait 2s" when they're already
 * out of quota.
 */
export async function checkRateLimit(args: RateCheckArgs): Promise<RateCheck> {
	const {
		ipHash,
		tier,
		windowMs,
		cooldownMs,
		perIpTokenBudget,
		premiumLimit,
		freeIpLimit,
	} = args;
	const isPremium = tier === "premium";
	const enforceCount = isPremium || freeIpLimit > 0;
	const limit = isPremium
		? premiumLimit
		: freeIpLimit > 0
			? freeIpLimit
			: Number.POSITIVE_INFINITY;
	const unlimited = !enforceCount;
	const computeRemaining = (used: number): number | null => {
		if (unlimited) return null;
		return Math.max(0, limit - used);
	};
	const now = new Date();
	/**
	 * Premium has an independent rolling window anchored on the visitor's
	 * *first premium message in the current window*. Without this, premium
	 * stays exhausted long after the visitor stops using it — because the
	 * row's general `windowStart` keeps getting anchored by free-model
	 * traffic that never touches `premiumCount`.
	 */
	const premiumWindowExpired = (start: Date | null | undefined): boolean => {
		if (!start) return true;
		return now.getTime() - new Date(start).getTime() >= windowMs;
	};

	// Read existing row first so we know whether to run the privacy lookup.
	const existing = await db
		.select()
		.from(agentRateLimits)
		.where(eq(agentRateLimits.ipHash, ipHash))
		.limit(1);
	const row = existing[0];

	if (row?.blockedReason) {
		return {
			allowed: false,
			remaining: 0,
			resetsAt: nextWindow(row.windowStart, windowMs),
			unlimited: false,
			tier,
			blockedReason: row.blockedReason,
		};
	}

	let privacy: PrivacyVerdict | null = null;
	if (!row && args.lookupPrivacy) {
		try {
			privacy = await args.lookupPrivacy();
		} catch {
			// IPInfo failure → don't block.
			privacy = null;
		}
		if (privacy?.blocked) {
			await db.insert(agentRateLimits).values({
				ipHash,
				count: 0,
				tokenCount: 0,
				windowStart: now,
				lastRequestAt: now,
				firstSeenCountry: privacy.country,
				firstSeenAsn: privacy.asn,
				privacyChecked: true,
				blockedReason: privacy.reason ?? "vpn",
			});
			return {
				allowed: false,
				remaining: 0,
				resetsAt: new Date(now.getTime() + windowMs),
				unlimited: false,
				tier,
				blockedReason: privacy.reason ?? "vpn",
			};
		}
	}

	if (!row) {
		await db.insert(agentRateLimits).values({
			ipHash,
			count: 1,
			premiumCount: isPremium ? 1 : 0,
			tokenCount: 0,
			windowStart: now,
			premiumWindowStart: isPremium ? now : null,
			lastRequestAt: now,
			firstSeenCountry: privacy?.country,
			firstSeenAsn: privacy?.asn,
			privacyChecked: privacy !== null,
		});
		return {
			allowed: true,
			remaining: computeRemaining(1),
			resetsAt: new Date(now.getTime() + windowMs),
			unlimited,
			tier,
		};
	}

	// Window roll for the general (free + premium aggregate) window.
	const windowExpired =
		now.getTime() - new Date(row.windowStart).getTime() >= windowMs;
	if (windowExpired) {
		await db
			.update(agentRateLimits)
			.set({
				count: 1,
				premiumCount: isPremium ? 1 : 0,
				tokenCount: 0,
				windowStart: now,
				premiumWindowStart: isPremium ? now : null,
				lastRequestAt: now,
			})
			.where(eq(agentRateLimits.ipHash, ipHash));
		return {
			allowed: true,
			remaining: computeRemaining(1),
			resetsAt: new Date(now.getTime() + windowMs),
			unlimited,
			tier,
		};
	}

	const resetsAt = new Date(new Date(row.windowStart).getTime() + windowMs);

	// Cooldown: minimum interval between two consecutive requests.
	const sinceLast = now.getTime() - new Date(row.lastRequestAt).getTime();
	if (sinceLast < cooldownMs) {
		const used = isPremium
			? premiumWindowExpired(row.premiumWindowStart)
				? 0
				: row.premiumCount
			: row.count;
		return {
			allowed: false,
			remaining: computeRemaining(used),
			resetsAt,
			unlimited,
			tier,
			blockedReason: "cooldown",
		};
	}

	// Per-IP token budget — the primary anti-abuse guardrail for unlimited
	// free traffic.
	if (row.tokenCount >= perIpTokenBudget) {
		return {
			allowed: false,
			remaining: 0,
			resetsAt,
			unlimited: false,
			tier,
			blockedReason: "ip_token_budget",
		};
	}

	// Free-model per-IP count cap (only when freeIpLimit > 0).
	if (!isPremium && freeIpLimit > 0 && row.count >= freeIpLimit) {
		return {
			allowed: false,
			remaining: 0,
			resetsAt,
			unlimited: false,
			tier,
			blockedReason: "limit_reached",
		};
	}

	// Premium sub-budget with its own rolling window. If the visitor's
	// premium window has expired (no premium use in the last `windowMs`),
	// treat the counter as fresh — they get a full premium quota again.
	const premiumStale = premiumWindowExpired(row.premiumWindowStart);
	const effectivePremiumUsed = premiumStale ? 0 : row.premiumCount;
	if (isPremium && effectivePremiumUsed >= premiumLimit) {
		return {
			allowed: false,
			remaining: 0,
			resetsAt,
			unlimited: false,
			tier,
			blockedReason: "premium_exhausted",
		};
	}

	// Decide the new premium counters. If this request is premium and the
	// prior premium window expired (or never started), anchor a fresh one.
	const nextPremiumCount = isPremium
		? premiumStale
			? 1
			: row.premiumCount + 1
		: row.premiumCount;
	const nextPremiumWindowStart: Date | null = isPremium
		? premiumStale
			? now
			: (row.premiumWindowStart ?? now)
		: row.premiumWindowStart;

	await db
		.update(agentRateLimits)
		.set({
			count: row.count + 1,
			premiumCount: nextPremiumCount,
			premiumWindowStart: nextPremiumWindowStart,
			lastRequestAt: now,
		})
		.where(eq(agentRateLimits.ipHash, ipHash));

	const remaining = isPremium
		? computeRemaining(nextPremiumCount)
		: computeRemaining(row.count + 1);
	return {
		allowed: true,
		remaining,
		resetsAt: isPremium
			? new Date((nextPremiumWindowStart ?? now).getTime() + windowMs)
			: resetsAt,
		unlimited,
		tier,
	};
}

/**
 * Read-only quota check used by `GET /api/agent/quota`. Doesn't mutate.
 *
 * For free models with `freeIpLimit === 0` returns `remaining: null` and
 * `unlimited: true`. For premium models reports usage against `premiumLimit`.
 */
export async function readQuota(args: {
	ipHash: string;
	tier: "free" | "premium";
	premiumLimit: number;
	freeIpLimit: number;
	windowMs: number;
}): Promise<{
	remaining: number | null;
	limit: number | null;
	unlimited: boolean;
	tier: "free" | "premium";
	resetsAt: Date;
}> {
	const { ipHash, tier, premiumLimit, freeIpLimit, windowMs } = args;
	const isPremium = tier === "premium";
	const enforce = isPremium || freeIpLimit > 0;
	const limit = isPremium ? premiumLimit : freeIpLimit > 0 ? freeIpLimit : null;
	const existing = await db
		.select()
		.from(agentRateLimits)
		.where(eq(agentRateLimits.ipHash, ipHash))
		.limit(1);
	const row = existing[0];
	const now = new Date();
	if (!row) {
		return {
			remaining: enforce ? (limit ?? 0) : null,
			limit,
			unlimited: !enforce,
			tier,
			resetsAt: new Date(now.getTime() + windowMs),
		};
	}
	const windowExpired =
		now.getTime() - new Date(row.windowStart).getTime() >= windowMs;
	if (windowExpired) {
		return {
			remaining: enforce ? (limit ?? 0) : null,
			limit,
			unlimited: !enforce,
			tier,
			resetsAt: new Date(now.getTime() + windowMs),
		};
	}
	// Premium uses its own rolling window so a visitor who tested premium
	// hours ago doesn't see a stale 0/cap reading after their last
	// premium request was more than `windowMs` ago.
	const premiumStale =
		!row.premiumWindowStart ||
		now.getTime() - new Date(row.premiumWindowStart).getTime() >= windowMs;
	const usedCount = isPremium
		? premiumStale
			? 0
			: row.premiumCount
		: row.count;
	const effectiveWindowStart = isPremium
		? premiumStale || !row.premiumWindowStart
			? null
			: new Date(row.premiumWindowStart)
		: new Date(row.windowStart);
	return {
		remaining: enforce ? Math.max(0, (limit ?? 0) - usedCount) : null,
		limit,
		unlimited: !enforce,
		tier,
		resetsAt: effectiveWindowStart
			? new Date(effectiveWindowStart.getTime() + windowMs)
			: new Date(now.getTime() + windowMs),
	};
}

/**
 * Tally token usage against both the per-IP budget and the daily global
 * budget. Called from the agent route after the stream completes.
 */
export async function addUsage({
	ipHash,
	tokens,
}: {
	ipHash: string;
	tokens: number;
}): Promise<void> {
	if (!Number.isFinite(tokens) || tokens <= 0) return;
	await db
		.update(agentRateLimits)
		.set({ tokenCount: sql`${agentRateLimits.tokenCount} + ${tokens}` })
		.where(eq(agentRateLimits.ipHash, ipHash));

	const today = todayUtc();
	await db
		.insert(agentUsageDaily)
		.values({ day: today, tokens, requests: 1 })
		.onConflictDoUpdate({
			target: agentUsageDaily.day,
			set: {
				tokens: sql`${agentUsageDaily.tokens} + ${tokens}`,
				requests: sql`${agentUsageDaily.requests} + 1`,
			},
		});
}

/**
 * Returns true when today's global token usage has hit the budget.
 *
 * Fails open when the database is unreachable (e.g. local dev with no
 * postgres running) — the alternative is a 500 on every agent call that
 * floods the dev console with the same DrizzleQueryError. The error is
 * logged once per call so production failures are still visible.
 */
export async function isDailyBudgetExhausted(budget: number): Promise<boolean> {
	const today = todayUtc();
	try {
		const rows = await db
			.select()
			.from(agentUsageDaily)
			.where(eq(agentUsageDaily.day, today))
			.limit(1);
		const used = rows[0]?.tokens ?? 0;
		return used >= budget;
	} catch (err) {
		logger.warn(
			{ err: err instanceof Error ? err.message : err },
			"[rate-limit] daily budget lookup failed; treating as not exhausted",
		);
		return false;
	}
}

function nextWindow(windowStart: Date | string, windowMs: number): Date {
	return new Date(new Date(windowStart).getTime() + windowMs);
}

function todayUtc(): string {
	// YYYY-MM-DD in UTC. Drizzle's `date` column accepts ISO date strings.
	return new Date().toISOString().slice(0, 10);
}
