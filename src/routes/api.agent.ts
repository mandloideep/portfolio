import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { assembleContext } from "#/lib/context";
import { getLlmConfig, getServerEnv } from "#/lib/env";
import {
	type ChatMessage,
	isModelForProvider,
	streamLlm,
} from "#/lib/openrouter";

/**
 * POST /api/agent — streams an LLM chat completion as SSE.
 *
 * Picks the provider from `LLM_PROVIDER` (defaults to `openrouter`) and
 * dispatches to the matching endpoint. The wire format is identical
 * (OpenAI-compatible Chat Completions) for both, so callers don't need
 * to know which one served the response.
 *
 * Event sequence:
 *   event: activity  data: {"step":"reading","files":[...]}
 *   event: activity  data: {"step":"calling","model":"...","provider":"..."}
 *   event: token     data: "<chunk>"
 *   ...
 *   event: done      data: {"tokens":N}
 * On failure:
 *   event: error     data: {"message":"..."}
 */

const RequestSchema = z.object({
	message: z.string().min(1).max(4000),
	history: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string().max(4000),
			}),
		)
		.max(20)
		.optional(),
	model: z.string().optional(),
});

export async function handleAgentRequest(request: Request): Promise<Response> {
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

	const env = getServerEnv();
	const { provider, apiKey, defaultModel } = getLlmConfig(env);
	const model =
		parsed.data.model && isModelForProvider(provider, parsed.data.model)
			? parsed.data.model
			: defaultModel;

	const { system, contextDocs, files } = assembleContext(parsed.data.message);
	const messages: ChatMessage[] = [
		{
			role: "system",
			content: contextDocs
				? `${system}\n\n# Context\n\n${contextDocs}`
				: system,
		},
		...(parsed.data.history ?? []),
		{ role: "user", content: parsed.data.message },
	];

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const enc = new TextEncoder();
			const write = (event: string, data: unknown) => {
				controller.enqueue(
					enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
				);
			};

			try {
				write("activity", { step: "reading", files });
				write("activity", { step: "calling", model, provider });

				let totalTokens = 0;
				let lastUsage: { total_tokens?: number } | undefined;
				for await (const ev of streamLlm({
					provider,
					apiKey,
					model,
					messages,
					signal: request.signal,
				})) {
					if (ev.type === "token") {
						totalTokens += 1;
						write("token", ev.text);
					} else {
						lastUsage = ev.usage;
					}
				}
				write("done", {
					tokens: lastUsage?.total_tokens ?? totalTokens,
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : "stream_failed";
				write("error", { message });
			} finally {
				controller.close();
			}
		},
		cancel() {
			// The fetch above is bound to request.signal; cancelling the response
			// stream surfaces back through the consumer when they `getReader()`.
		},
	});

	return new Response(stream, {
		status: 200,
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-store",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}

function jsonError(status: number, code: string): Response {
	return new Response(JSON.stringify({ error: code }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const Route = createFileRoute("/api/agent")({
	server: {
		handlers: {
			POST: ({ request }) => handleAgentRequest(request),
		},
	},
});
