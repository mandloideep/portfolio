import { afterEach, describe, expect, it, vi } from "vitest";
import {
	isOpenRouterModel,
	OPENROUTER_MODELS,
	parseSseStream,
	streamOpenRouter,
} from "./openrouter";

function bodyFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
	const enc = new TextEncoder();
	let i = 0;
	return new ReadableStream({
		pull(controller) {
			if (i >= chunks.length) {
				controller.close();
				return;
			}
			controller.enqueue(enc.encode(chunks[i] ?? ""));
			i += 1;
		},
	});
}

function dataFrame(payload: unknown): string {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("OPENROUTER_MODELS", () => {
	it("has the curated allowlist with stable ids", () => {
		expect(OPENROUTER_MODELS.length).toBeGreaterThanOrEqual(5);
		expect(OPENROUTER_MODELS[0].id).toBe("google/gemini-2.5-flash-lite");
	});

	it("isOpenRouterModel guards against unknown ids", () => {
		expect(isOpenRouterModel("anthropic/claude-haiku-4.5")).toBe(true);
		expect(isOpenRouterModel("not/a-model")).toBe(false);
	});
});

describe("parseSseStream", () => {
	it("yields token + done events from a recorded sequence", async () => {
		const stream = bodyFromChunks([
			dataFrame({ choices: [{ delta: { content: "Hello" } }] }),
			dataFrame({ choices: [{ delta: { content: ", world" } }] }),
			dataFrame({ choices: [{ delta: { content: "!" } }] }),
			`data: [DONE]\n\n`,
		]);

		const events = [];
		for await (const ev of parseSseStream(stream)) events.push(ev);

		expect(events).toEqual([
			{ type: "token", text: "Hello" },
			{ type: "token", text: ", world" },
			{ type: "token", text: "!" },
			{ type: "done", usage: undefined },
		]);
	});

	it("captures usage from the final frame", async () => {
		const stream = bodyFromChunks([
			dataFrame({ choices: [{ delta: { content: "x" } }] }),
			dataFrame({
				choices: [{ delta: {} }],
				usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
			}),
			`data: [DONE]\n\n`,
		]);

		const events = [];
		for await (const ev of parseSseStream(stream)) events.push(ev);

		expect(events[events.length - 1]).toEqual({
			type: "done",
			usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
		});
	});

	it("ignores malformed and empty data lines", async () => {
		const stream = bodyFromChunks([
			`data: not json\n\n`,
			`data: \n\n`,
			dataFrame({ choices: [{ delta: { content: "ok" } }] }),
			`data: [DONE]\n\n`,
		]);

		const events = [];
		for await (const ev of parseSseStream(stream)) events.push(ev);

		expect(events).toEqual([
			{ type: "token", text: "ok" },
			{ type: "done", usage: undefined },
		]);
	});

	it("survives a frame that splits across chunk boundaries", async () => {
		const frame = dataFrame({ choices: [{ delta: { content: "split" } }] });
		const half = Math.floor(frame.length / 2);
		const stream = bodyFromChunks([
			frame.slice(0, half),
			frame.slice(half),
			`data: [DONE]\n\n`,
		]);

		const events = [];
		for await (const ev of parseSseStream(stream)) events.push(ev);

		expect(events[0]).toEqual({ type: "token", text: "split" });
	});
});

describe("streamOpenRouter", () => {
	it("posts the stream request and yields parsed events", async () => {
		const stream = bodyFromChunks([
			dataFrame({ choices: [{ delta: { content: "hi" } }] }),
			`data: [DONE]\n\n`,
		]);
		const fetchMock = vi.fn<typeof fetch>().mockImplementation(
			async () =>
				new Response(stream, {
					status: 200,
					headers: { "Content-Type": "text/event-stream" },
				}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const events = [];
		for await (const ev of streamOpenRouter({
			apiKey: "test-key",
			model: "google/gemini-2.5-flash-lite",
			messages: [{ role: "user", content: "hi" }],
		})) {
			events.push(ev);
		}

		expect(events).toEqual([
			{ type: "token", text: "hi" },
			{ type: "done", usage: undefined },
		]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const call = fetchMock.mock.calls[0];
		expect(call[0]).toBe("https://openrouter.ai/api/v1/chat/completions");
		const init = call[1] as RequestInit;
		expect(init.method).toBe("POST");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"Bearer test-key",
		);
		expect(JSON.parse(init.body as string)).toMatchObject({
			model: "google/gemini-2.5-flash-lite",
			stream: true,
		});
	});

	it("throws on non-200 with a truncated body excerpt", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(async () => new Response("bad key", { status: 401 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			(async () => {
				for await (const _ of streamOpenRouter({
					apiKey: "x",
					model: "google/gemini-2.5-flash-lite",
					messages: [],
				})) {
					// pass
				}
			})(),
		).rejects.toThrow(/401/);
	});

	it("abort signal stops iteration mid-stream", async () => {
		const controller = new AbortController();
		const enc = new TextEncoder();
		let firstPull = true;
		const stream = new ReadableStream<Uint8Array>({
			pull(c) {
				if (firstPull) {
					firstPull = false;
					c.enqueue(
						enc.encode(dataFrame({ choices: [{ delta: { content: "a" } }] })),
					);
				}
				// Subsequent pulls: do nothing — reader awaits until our internal
				// abort listener cancels it.
			},
		});
		vi.stubGlobal(
			"fetch",
			vi
				.fn<typeof fetch>()
				.mockImplementation(async () => new Response(stream, { status: 200 })),
		);

		const iterator = streamOpenRouter({
			apiKey: "x",
			model: "google/gemini-2.5-flash-lite",
			messages: [],
			signal: controller.signal,
		});

		const first = await iterator.next();
		expect(first.value).toEqual({ type: "token", text: "a" });

		controller.abort();
		await expect(iterator.next()).rejects.toThrow(/aborted/i);
	});
});
