import { createFileRoute } from "@tanstack/react-router";
import { getServerEnv } from "#/lib/env";
import { getClientIp, hashIp, readQuota } from "#/lib/rate-limit";

/**
 * GET /api/agent/quota — returns the caller's remaining message count for
 * the current rolling window, without incrementing it. The terminal calls
 * this on mount so the footer shows `N/5 messages` before the user types.
 */
export async function handleQuotaRequest(request: Request): Promise<Response> {
	let env: ReturnType<typeof getServerEnv>;
	try {
		env = getServerEnv();
	} catch {
		return jsonOk({ remaining: 0, resetsAt: null, error: "agent_unavailable" });
	}
	const ip = getClientIp(request);
	const salt = env.RATE_LIMIT_SALT ?? "portfolio-default-salt";
	const ipHash = hashIp(ip, salt);
	try {
		const { remaining, resetsAt } = await readQuota(
			ipHash,
			env.RATE_LIMIT_MAX,
			env.RATE_LIMIT_WINDOW_MS,
		);
		return jsonOk({
			remaining,
			resetsAt: resetsAt.toISOString(),
			limit: env.RATE_LIMIT_MAX,
		});
	} catch {
		// Fail-open with a best-guess remaining count if the DB hiccups.
		return jsonOk({
			remaining: env.RATE_LIMIT_MAX,
			resetsAt: new Date(Date.now() + env.RATE_LIMIT_WINDOW_MS).toISOString(),
			limit: env.RATE_LIMIT_MAX,
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
