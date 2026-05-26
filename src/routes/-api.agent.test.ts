import { afterEach, describe, expect, it, vi } from "vitest";

// Same mock shape as -api.github-graph.test.ts: getServerEnv refuses to run
// from jsdom, so we stub it out.
vi.mock("#/lib/env", () => ({
	getServerEnv: () => ({
		LLM_PROVIDER: "openrouter",
		OPENROUTER_API_KEY: "test-or",
		OPENROUTER_DEFAULT_MODEL: "google/gemini-2.5-flash-lite",
		GITHUB_TOKEN: "test-token",
		GITHUB_USERNAME: "deep",
		RATE_LIMIT_SALT: "test-salt",
		RATE_LIMIT_MAX: 5,
		RATE_LIMIT_WINDOW_MS: 86_400_000,
		DAILY_TOKEN_BUDGET: 200_000,
		PER_IP_TOKEN_BUDGET: 20_000,
		BLOCK_VPN: false,
		WORD_CAP: 30,
		CLASSIFIER_ENABLED: false,
		MAX_OUTPUT_TOKENS: 400,
		MIN_REQUEST_INTERVAL_MS: 0,
		REQUEST_TIMEOUT_MS: 20_000,
	}),
	getLlmConfig: () => ({
		provider: "openrouter",
		apiKey: "test-or",
		defaultModel: "google/gemini-2.5-flash-lite",
	}),
	_resetEnvCacheForTests: () => {},
}));

// Storage-touching modules: stub them with no-op happy-path returns so the
// route's happy path stays testable without a live Postgres.
vi.mock("#/lib/rate-limit", () => ({
	getClientIp: () => "1.2.3.4",
	hashIp: (ip: string) => `hash:${ip}`,
	checkRateLimit: vi.fn(async () => ({
		allowed: true,
		remaining: 4,
		resetsAt: new Date(Date.now() + 86_400_000),
	})),
	readQuota: vi.fn(async () => ({
		remaining: 5,
		resetsAt: new Date(Date.now() + 86_400_000),
	})),
	addUsage: vi.fn(async () => {}),
	isDailyBudgetExhausted: vi.fn(async () => false),
}));
vi.mock("#/lib/ipinfo", () => ({
	lookupIp: vi.fn(async () => ({ blocked: false })),
}));
vi.mock("#/lib/classifier", () => ({
	classifyPrompt: vi.fn(async () => "SAFE"),
}));

import { handleAgentRequest } from "./api.agent";

function sseChunk(payload: unknown): string {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

function openRouterBody(chunks: string[]): ReadableStream<Uint8Array> {
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

async function readSseEvents(
	res: Response,
): Promise<Array<{ event: string; data: unknown }>> {
	if (!res.body) throw new Error("missing response body");
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	const events: Array<{ event: string; data: unknown }> = [];
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		let boundary = buffer.indexOf("\n\n");
		while (boundary !== -1) {
			const frame = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);
			let event = "message";
			let dataLine = "";
			for (const line of frame.split("\n")) {
				if (line.startsWith("event:")) event = line.slice(6).trim();
				if (line.startsWith("data:")) dataLine = line.slice(5).trim();
			}
			if (dataLine) {
				try {
					events.push({ event, data: JSON.parse(dataLine) });
				} catch {
					events.push({ event, data: dataLine });
				}
			}
			boundary = buffer.indexOf("\n\n");
		}
	}
	return events;
}

function postRequest(
	body: unknown,
	extraHeaders: Record<string, string> = {},
): Request {
	return new Request("http://test/api/agent", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			// Pass a real-browser UA so the guard doesn't reject every request.
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			...extraHeaders,
		},
		body: JSON.stringify(body),
	});
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("handleAgentRequest", () => {
	it("400 on invalid JSON body", async () => {
		const req = new Request("http://test/api/agent", {
			method: "POST",
			body: "not json",
		});
		const res = await handleAgentRequest(req);
		expect(res.status).toBe(400);
	});

	it("400 when message is missing or empty", async () => {
		const res = await handleAgentRequest(postRequest({ message: "" }));
		expect(res.status).toBe(400);
	});

	it("streams reading → calling → token(s) → done", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(
						openRouterBody([
							sseChunk({ choices: [{ delta: { content: "hello" } }] }),
							sseChunk({ choices: [{ delta: { content: " there" } }] }),
							"data: [DONE]\n\n",
						]),
						{ status: 200 },
					),
			);
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleAgentRequest(postRequest({ message: "hi" }));
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toMatch(/text\/event-stream/);
		expect(res.headers.get("Cache-Control")).toBe("no-store");

		const events = await readSseEvents(res);
		const types = events.map((e) => e.event);
		expect(types[0]).toBe("quota");
		const activities = events.filter((e) => e.event === "activity");
		expect((activities[0]?.data as { step?: string })?.step).toBe("reading");
		expect((activities[1]?.data as { step?: string })?.step).toBe("calling");
		expect(types).toContain("token");
		expect(types[types.length - 1]).toBe("done");
		const tokens = events.filter((e) => e.event === "token").map((e) => e.data);
		expect(tokens).toEqual(["hello", " there"]);
	});

	it("falls back to default model when requested model is not allowlisted", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(openRouterBody(["data: [DONE]\n\n"]), { status: 200 }),
			);
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleAgentRequest(
			postRequest({ message: "hi", model: "not/a-real-model" }),
		);
		await readSseEvents(res);

		const body = JSON.parse(
			(fetchMock.mock.calls[0]?.[1]?.body ?? "{}") as string,
		);
		expect(body.model).toBe("google/gemini-2.5-flash-lite");
	});

	it("honours a model from the allowlist", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(openRouterBody(["data: [DONE]\n\n"]), { status: 200 }),
			);
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleAgentRequest(
			postRequest({
				message: "hi",
				model: "anthropic/claude-haiku-4.5",
			}),
		);
		await readSseEvents(res);

		const body = JSON.parse(
			(fetchMock.mock.calls[0]?.[1]?.body ?? "{}") as string,
		);
		expect(body.model).toBe("anthropic/claude-haiku-4.5");
	});

	it("emits an error event when OpenRouter fails", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(async () => new Response("nope", { status: 500 }));
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleAgentRequest(postRequest({ message: "hi" }));
		const events = await readSseEvents(res);
		expect(events.some((e) => e.event === "error")).toBe(true);
	});

	it("includes context files based on keyword routing", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(openRouterBody(["data: [DONE]\n\n"]), { status: 200 }),
			);
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleAgentRequest(
			postRequest({ message: "what projects have you built" }),
		);
		const events = await readSseEvents(res);
		const reading = events.find(
			(e) =>
				e.event === "activity" &&
				(e.data as { step: string }).step === "reading",
		);
		expect(reading).toBeDefined();
		const files = (reading?.data as { files: string[] }).files;
		expect(files.some((f) => f.startsWith("projects/"))).toBe(true);
	});

	it("emits rate_limited when checkRateLimit returns allowed=false", async () => {
		const { checkRateLimit } = await import("#/lib/rate-limit");
		(
			checkRateLimit as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValueOnce({
			allowed: false,
			remaining: 0,
			resetsAt: new Date(Date.now() + 1_000_000),
			blockedReason: "limit_reached",
		});
		const res = await handleAgentRequest(postRequest({ message: "hi" }));
		expect(res.status).toBe(200);
		const events = await readSseEvents(res);
		expect(events.some((e) => e.event === "rate_limited")).toBe(true);
	});

	it("rejects requests with a non-browser User-Agent", async () => {
		const res = await handleAgentRequest(
			postRequest({ message: "hi" }, { "User-Agent": "curl/8.4.0" }),
		);
		const events = await readSseEvents(res);
		expect(events.some((e) => e.event === "error")).toBe(true);
	});

	it("rejects prompts longer than the word cap", async () => {
		const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
		const res = await handleAgentRequest(postRequest({ message: long }));
		const events = await readSseEvents(res);
		const err = events.find((e) => e.event === "error");
		expect(err).toBeDefined();
		expect((err?.data as { message?: string })?.message).toBe(
			"prompt_too_long",
		);
	});

	it("rejects prompts containing PII patterns", async () => {
		const res = await handleAgentRequest(
			postRequest({ message: "is 123-45-6789 valid?" }),
		);
		const events = await readSseEvents(res);
		const err = events.find((e) => e.event === "error");
		expect(err).toBeDefined();
		expect((err?.data as { message?: string })?.message).toBe("rejected");
	});

	it("rejects requests with the honeypot field set", async () => {
		const res = await handleAgentRequest(
			postRequest({ message: "hi", _hp: "i am a bot" }),
		);
		const events = await readSseEvents(res);
		expect(events.some((e) => e.event === "error")).toBe(true);
	});

	it("threads history into the OpenRouter messages array", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(openRouterBody(["data: [DONE]\n\n"]), { status: 200 }),
			);
		vi.stubGlobal("fetch", fetchMock);

		const res = await handleAgentRequest(
			postRequest({
				message: "and what else",
				history: [
					{ role: "user", content: "first" },
					{ role: "assistant", content: "answer" },
				],
			}),
		);
		await readSseEvents(res);

		const body = JSON.parse(
			(fetchMock.mock.calls[0]?.[1]?.body ?? "{}") as string,
		);
		expect(body.messages[0].role).toBe("system");
		expect(body.messages[1]).toEqual({ role: "user", content: "first" });
		expect(body.messages[2]).toEqual({ role: "assistant", content: "answer" });
		expect(body.messages[3]).toEqual({
			role: "user",
			content: "and what else",
		});
	});
});
