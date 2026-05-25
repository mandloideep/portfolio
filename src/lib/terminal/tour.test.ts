import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	abortAgentStream,
	useAgentStream,
} from "#/components/terminal/use-agent-stream";
import { DEFAULT_MODEL_ID, modelStore } from "#/store/model";
import { terminalStore } from "#/store/terminal";
import {
	_BEATS_FOR_TESTS,
	abortTour,
	isTourRunning,
	runPresentation,
} from "./tour";

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

function makeFetchMock() {
	return vi
		.fn<typeof fetch>()
		.mockImplementation(
			async () =>
				new Response(
					sseBody([sseFrame("token", "hi"), sseFrame("done", { tokens: 1 })]),
					{ status: 200 },
				),
		);
}

function mockMatchMedia(reduced: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: reduced && query.includes("reduced"),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
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
	abortTour();
	mockMatchMedia(true); // skip inter-beat pauses by default
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("runPresentation", () => {
	it("emits one header system block + one markdown block per beat in order", async () => {
		vi.stubGlobal("fetch", makeFetchMock());
		const { result } = renderHook(() => useAgentStream());

		await act(async () => {
			await runPresentation({ agentStream: result.current });
		});

		const headers = terminalStore.state.blocks.filter(
			(b) => b.kind === "system" && b.text.startsWith("→"),
		);
		expect(headers.length).toBe(_BEATS_FOR_TESTS.length);
		expect(headers.map((b) => "text" in b && b.text)).toEqual(
			_BEATS_FOR_TESTS.map((b) => b.header),
		);

		const markdowns = terminalStore.state.blocks.filter(
			(b) => b.kind === "markdown",
		);
		expect(markdowns.length).toBe(_BEATS_FOR_TESTS.length);
		expect(isTourRunning()).toBe(false);
	});

	it("rejects a second invocation while one is running", async () => {
		// Fetch hangs until its abort signal fires, then rejects cleanly.
		const fetchMock = vi.fn<typeof fetch>().mockImplementation(
			(_, init) =>
				new Promise<Response>((_resolve, reject) => {
					const sig = (init as RequestInit | undefined)?.signal;
					sig?.addEventListener("abort", () => {
						const err = new Error("aborted");
						err.name = "AbortError";
						reject(err);
					});
				}),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useAgentStream());

		let firstResolved = false;
		const firstRun = runPresentation({ agentStream: result.current }).then(
			() => {
				firstResolved = true;
			},
		);
		// Let the first beat's fetch attach its abort listener.
		await act(async () => {
			await Promise.resolve();
		});
		expect(isTourRunning()).toBe(true);

		// Second call must return without doing anything (no new fetch).
		const fetchCallsBefore = fetchMock.mock.calls.length;
		await act(async () => {
			await runPresentation({ agentStream: result.current });
		});
		expect(fetchMock.mock.calls.length).toBe(fetchCallsBefore);
		expect(isTourRunning()).toBe(true);
		expect(firstResolved).toBe(false);

		// Clean up: abort unwinds both the tour and the in-flight fetch.
		await act(async () => {
			abortTour();
			await firstRun;
		});
	});

	it("abortTour mid-stream stops further beats from emitting", async () => {
		const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
			// One token + done; finishes immediately. We abort BEFORE running
			// to verify the loop checks signal.aborted and stops on entry.
			return new Response(
				sseBody([sseFrame("token", "x"), sseFrame("done", { tokens: 1 })]),
				{ status: 200 },
			);
		});
		vi.stubGlobal("fetch", fetchMock);
		const { result } = renderHook(() => useAgentStream());

		const pending = act(async () => {
			const p = runPresentation({ agentStream: result.current });
			// Abort after a microtask — first beat may have started fetch
			await Promise.resolve();
			abortTour();
			await p;
		});
		await pending;

		const headers = terminalStore.state.blocks.filter(
			(b) => b.kind === "system" && b.text.startsWith("→"),
		);
		// At least the first header landed; the rest were skipped.
		expect(headers.length).toBeGreaterThanOrEqual(1);
		expect(headers.length).toBeLessThan(_BEATS_FOR_TESTS.length);
		expect(isTourRunning()).toBe(false);
	});
});
