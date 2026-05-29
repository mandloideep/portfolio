import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getModelConfig, getServerEnv, resolveDefaultModel } from "#/lib/env";
import { checkAndRecordLlmCall } from "#/lib/llm-rate-limit";
import { completeLlm } from "#/lib/openrouter";
import { COMMENTARY_PROMPT } from "#/lib/terminal/github-quips";

const RequestSchema = z.object({
	stats: z.unknown(),
});

/**
 * POST /api/agent/commentary — runs a tiny LLM call against the pinned free
 * model (Gemma) to produce a one-sentence snark about the supplied GitHub
 * stats JSON. Used by the terminal `/stats` command. Returns plain text.
 *
 * Always pinned to `LLM_FREE_MODEL` so it never touches the premium quota.
 */
export async function handleCommentaryRequest(
	request: Request,
): Promise<Response> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError(400, "invalid_json");
	}
	const parsed = RequestSchema.safeParse(body);
	if (!parsed.success) {
		return jsonError(400, "invalid_request");
	}

	let env: ReturnType<typeof getServerEnv>;
	try {
		env = getServerEnv();
	} catch {
		return jsonError(503, "agent_unavailable");
	}

	// Pin commentary to LLM_FREE_MODEL when its provider key is set;
	// otherwise fall back to the deploy's default free model so commentary
	// works even on single-key setups.
	const preferredId = env.LLM_FREE_MODEL ?? "gemma-4-31b-it";
	const cfg =
		getModelConfig(env, preferredId) ??
		getModelConfig(env, resolveDefaultModel(env).id);
	if (!cfg) {
		return jsonError(503, "agent_unavailable");
	}
	const { provider, apiKey, model } = cfg;

	const quota = await checkAndRecordLlmCall({
		provider,
		model,
	});
	if (!quota.allowed) {
		return jsonError(429, `rate_limited_${quota.reason}`);
	}

	try {
		const stats = JSON.stringify(parsed.data.stats).slice(0, 4000);
		const reply = await completeLlm({
			provider,
			apiKey,
			model,
			messages: [
				{ role: "system", content: COMMENTARY_PROMPT },
				{ role: "user", content: stats },
			],
			maxTokens: 384,
			temperature: 0.6,
			signal: request.signal,
		});
		return new Response(JSON.stringify({ commentary: reply.trim() }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store",
			},
		});
	} catch {
		return jsonError(502, "llm_unavailable");
	}
}

function jsonError(status: number, code: string): Response {
	return new Response(JSON.stringify({ error: code }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const Route = createFileRoute("/api/agent/commentary")({
	server: {
		handlers: {
			POST: ({ request }) => handleCommentaryRequest(request),
		},
	},
});
