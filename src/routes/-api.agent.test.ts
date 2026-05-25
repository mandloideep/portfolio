import { afterEach, describe, expect, it, vi } from "vitest";

// Same mock shape as -api.github-graph.test.ts: getServerEnv refuses to run
// from jsdom, so we stub it out.
vi.mock("#/lib/env", () => ({
	getServerEnv: () => ({
		OPENROUTER_API_KEY: "test-or",
		OPENROUTER_DEFAULT_MODEL: "google/gemini-2.5-flash-lite",
		GITHUB_TOKEN: "test-token",
		GITHUB_USERNAME: "deep",
	}),
	_resetEnvCacheForTests: () => {},
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

function postRequest(body: unknown): Request {
	return new Request("http://test/api/agent", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
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
		expect(types[0]).toBe("activity"); // reading
		expect(types[1]).toBe("activity"); // calling
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
