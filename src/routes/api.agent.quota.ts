import { createFileRoute } from "@tanstack/react-router";
import { isPremiumModel } from "#/lib/agent/models";
import { getServerEnv, resolveDefaultModel } from "#/lib/env";
import { getClientIp, hashIp, readQuota } from "#/lib/rate-limit";

/**
 * GET /api/agent/quota — returns the caller's remaining message count for
 * the current rolling window. Tier-aware: pass `?model=<id>` to scope the
 * read to a specific model's tier. Free models return `unlimited: true`
 * (and `remaining: null`) when `FREE_MODEL_PER_IP_LIMIT=0`; premium models
 * report `remaining` against `PREMIUM_LIMIT`.
 *
 * The terminal calls this on mount so the footer paints the right chip
 * before the user types.
 */
export async function handleQuotaRequest(request: Request): Promise<Response> {
	let env: ReturnType<typeof getServerEnv>;
	try {
		env = getServerEnv();
	} catch {
		return jsonOk({
			remaining: 0,
			resetsAt: null,
			tier: "free",
			unlimited: false,
			limit: null,
			error: "agent_unavailable",
		});
	}

	const url = new URL(request.url);
	const requestedModel = url.searchParams.get("model");
	const modelId = requestedModel ?? resolveDefaultModel(env).id;
	const tier: "free" | "premium" = isPremiumModel(modelId) ? "premium" : "free";

	const ip = getClientIp(request);
	const salt = env.RATE_LIMIT_SALT ?? "portfolio-default-salt";
	const ipHash = hashIp(ip, salt);
	try {
		const result = await readQuota({
			ipHash,
			tier,
			premiumLimit: env.PREMIUM_LIMIT,
			freeIpLimit: env.FREE_MODEL_PER_IP_LIMIT,
			windowMs: env.RATE_LIMIT_WINDOW_MS,
		});
		return jsonOk({
			remaining: result.remaining,
			limit: result.limit,
			unlimited: result.unlimited,
			tier: result.tier,
			resetsAt: result.resetsAt.toISOString(),
			model: modelId,
		});
	} catch {
		// Fail-open with a best-guess shape if the DB hiccups.
		const fallbackLimit =
			tier === "premium"
				? env.PREMIUM_LIMIT
				: env.FREE_MODEL_PER_IP_LIMIT > 0
					? env.FREE_MODEL_PER_IP_LIMIT
					: null;
		return jsonOk({
			remaining: fallbackLimit,
			limit: fallbackLimit,
			unlimited: fallbackLimit === null,
			tier,
			resetsAt: new Date(Date.now() + env.RATE_LIMIT_WINDOW_MS).toISOString(),
			model: modelId,
		});
	}
}

function jsonOk(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store",
		},
	});
}

export const Route = createFileRoute("/api/agent/quota")({
	server: {
		handlers: {
			GET: ({ request }) => handleQuotaRequest(request),
		},
	},
});
