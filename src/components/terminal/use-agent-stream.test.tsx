import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL_ID, modelStore } from "#/store/model";
import { terminalStore } from "#/store/terminal";
import {
	abortAgentStream,
	isAgentStreaming,
	useAgentStream,
} from "./use-agent-stream";

function sseBody(chunks: string[]): ReadableStream<Uint8Array> {
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

function sseFrame(event: string, data: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
		cwd: "~",
	}));
	modelStore.setState(() => ({ activeModel: DEFAULT_MODEL_ID }));
	abortAgentStream();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useAgentStream", () => {
	it("appends activity blocks and accumulates tokens into one markdown block", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(
						sseBody([
							sseFrame("activity", { step: "reading", files: ["me.md"] }),
							sseFrame("activity", { step: "calling", model: "x" }),
							sseFrame("token", "Hello"),
							sseFrame("token", ", world"),
							sseFrame("token", "!"),
							sseFrame("done", { tokens: 7 }),
						]),
						{ status: 200 },
					),
			);
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAgentStream());
		await act(async () => {
			await result.current.start("hi");
		});

		const blocks = terminalStore.state.blocks;
		const activities = blocks.filter((b) => b.kind === "activity");
		expect(activities.length).toBe(2);
		const markdowns = blocks.filter((b) => b.kind === "markdown");
		expect(markdowns.length).toBe(1);
		expect(markdowns[0] && "text" in markdowns[0] && markdowns[0].text).toBe(
			"Hello, world!",
		);
		// done event emits a (tokens) system note
		const systemTail = blocks.filter((b) => b.kind === "system").pop();
		expect(systemTail && "text" in systemTail && systemTail.text).toMatch(
			/7 tokens/,
		);
		expect(isAgentStreaming()).toBe(false);
	});

	it("sends the active model + recent history in the POST body", async () => {
		modelStore.setState(() => ({ activeModel: "anthropic/claude-haiku-4.5" }));
		// Prime the store with prior chat history
		terminalStore.setState((s) => ({
			...s,
			blocks: [
				{
					id: "p1",
					kind: "prompt",
					mode: "agent",
					text: "first question",
					ts: 1,
				},
				{ id: "m1", kind: "markdown", text: "first answer", ts: 2 },
			],
		}));

		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(
						sseBody([sseFrame("token", "ok"), sseFrame("done", { tokens: 1 })]),
						{ status: 200 },
					),
			);
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAgentStream());
		await act(async () => {
			await result.current.start("second question");
		});

		const body = JSON.parse(
			(fetchMock.mock.calls[0]?.[1]?.body ?? "{}") as string,
		);
		expect(body.message).toBe("second question");
		expect(body.model).toBe("anthropic/claude-haiku-4.5");
		expect(body.history).toEqual([
			{ role: "user", content: "first question" },
			{ role: "assistant", content: "first answer" },
		]);
	});

	it("emits an error block when the route returns a non-200", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(async () => new Response("nope", { status: 500 }));
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAgentStream());
		await act(async () => {
			await result.current.start("hi");
		});

		const last = terminalStore.state.blocks.pop();
		expect(last?.kind).toBe("error");
	});

	it("forwards SSE error events to an error block", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(
						sseBody([sseFrame("error", { message: "upstream_500" })]),
						{ status: 200 },
					),
			);
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAgentStream());
		await act(async () => {
			await result.current.start("hi");
		});

		const errBlock = terminalStore.state.blocks.find((b) => b.kind === "error");
		expect(errBlock && "text" in errBlock && errBlock.text).toMatch(
			/upstream_500/,
		);
	});

	it("abort stops the stream and emits a ^C system block", async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				const enc = new TextEncoder();
				controller.enqueue(enc.encode(sseFrame("token", "partial")));
				// never close on its own — wait for abort
			},
		});
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(async (_, init) => {
				const sig = (init as RequestInit | undefined)?.signal;
				sig?.addEventListener("abort", () =>
					stream.cancel("abort").catch(() => {}),
				);
				return new Response(stream, { status: 200 });
			});
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useAgentStream());

		await act(async () => {
			const pending = result.current.start("hi");
			// Wait a tick for the first token to flush before aborting
			await new Promise((r) => setTimeout(r, 10));
			result.current.abort();
			await pending;
		});

		const markdown = terminalStore.state.blocks.find(
			(b) => b.kind === "markdown",
		);
		expect(markdown && "text" in markdown && markdown.text).toBe("partial");
		const system = terminalStore.state.blocks.find(
			(b) => b.kind === "system" && b.text === "^C aborted",
		);
		expect(system).toBeDefined();
		expect(isAgentStreaming()).toBe(false);
	});
});
