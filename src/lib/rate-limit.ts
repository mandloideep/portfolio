import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "#/db";
import { agentRateLimits, agentUsageDaily } from "#/db/schema";

export type PrivacyVerdict = {
	country?: string;
	asn?: string;
	blocked: boolean;
	reason?: "vpn" | "proxy" | "hosting" | "tor";
};

export type RateCheck = {
	allowed: boolean;
	remaining: number;
	resetsAt: Date;
	blockedReason?: string;
};

export type RateCheckArgs = {
	ipHash: string;
	limit: number;
	windowMs: number;
	cooldownMs: number;
	perIpTokenBudget: number;
	/**
	 * Sub-budget for paid models. When `isPremium` is true the check also
	 * enforces `premiumCount < premiumLimit`.
	 */
	premiumLimit: number;
	isPremium: boolean;
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
		limit,
		windowMs,
		cooldownMs,
		perIpTokenBudget,
		premiumLimit,
		isPremium,
	} = args;
	const now = new Date();

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
			lastRequestAt: now,
			firstSeenCountry: privacy?.country,
			firstSeenAsn: privacy?.asn,
			privacyChecked: privacy !== null,
		});
		return {
			allowed: true,
			remaining: Math.max(0, limit - 1),
			resetsAt: new Date(now.getTime() + windowMs),
		};
	}

	// Window roll.
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
				lastRequestAt: now,
			})
			.where(eq(agentRateLimits.ipHash, ipHash));
		return {
			allowed: true,
			remaining: Math.max(0, limit - 1),
			resetsAt: new Date(now.getTime() + windowMs),
		};
	}

	const resetsAt = new Date(new Date(row.windowStart).getTime() + windowMs);

	// Cooldown: minimum interval between two consecutive requests.
	const sinceLast = now.getTime() - new Date(row.lastRequestAt).getTime();
	if (sinceLast < cooldownMs) {
		return {
			allowed: false,
			remaining: Math.max(0, limit - row.count),
			resetsAt,
			blockedReason: "cooldown",
		};
	}

	// Per-IP token budget.
	if (row.tokenCount >= perIpTokenBudget) {
		return {
			allowed: false,
			remaining: 0,
			resetsAt,
			blockedReason: "ip_token_budget",
		};
	}

	// Message count limit.
	if (row.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetsAt,
			blockedReason: "limit_reached",
		};
	}

	// Premium sub-budget.
	if (isPremium && row.premiumCount >= premiumLimit) {
		return {
			allowed: false,
			remaining: Math.max(0, limit - row.count),
			resetsAt,
			blockedReason: "premium_exhausted",
		};
	}

	await db
		.update(agentRateLimits)
		.set({
			count: row.count + 1,
			premiumCount: isPremium ? row.premiumCount + 1 : row.premiumCount,
			lastRequestAt: now,
		})
		.where(eq(agentRateLimits.ipHash, ipHash));

	return {
		allowed: true,
		remaining: Math.max(0, limit - (row.count + 1)),
		resetsAt,
	};
}

/**
 * Read-only quota check used by `GET /api/agent/quota`. Doesn't mutate.
 */
export async function readQuota(
	ipHash: string,
	limit: number,
	windowMs: number,
): Promise<{ remaining: number; resetsAt: Date }> {
	const existing = await db
		.select()
		.from(agentRateLimits)
		.where(eq(agentRateLimits.ipHash, ipHash))
		.limit(1);
	const row = existing[0];
	const now = new Date();
	if (!row) {
		return {
			remaining: limit,
			resetsAt: new Date(now.getTime() + windowMs),
		};
	}
	const windowExpired =
		now.getTime() - new Date(row.windowStart).getTime() >= windowMs;
	if (windowExpired) {
		return {
			remaining: limit,
			resetsAt: new Date(now.getTime() + windowMs),
		};
	}
	return {
		remaining: Math.max(0, limit - row.count),
		resetsAt: new Date(new Date(row.windowStart).getTime() + windowMs),
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

/** Returns true when today's global token usage has hit the budget. */
export async function isDailyBudgetExhausted(budget: number): Promise<boolean> {
	const today = todayUtc();
	const rows = await db
		.select()
		.from(agentUsageDaily)
		.where(eq(agentUsageDaily.day, today))
		.limit(1);
	const used = rows[0]?.tokens ?? 0;
	return used >= budget;
}

function nextWindow(windowStart: Date | string, windowMs: number): Date {
	return new Date(new Date(windowStart).getTime() + windowMs);
}

function todayUtc(): string {
	// YYYY-MM-DD in UTC. Drizzle's `date` column accepts ISO date strings.
	return new Date().toISOString().slice(0, 10);
}
