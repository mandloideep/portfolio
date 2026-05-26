import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { terminalStore } from "#/store/terminal";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

// Import after mock so the hook resolves to the mocked navigate.
import { AgentTestWrapper } from "#/components/agent/test-utils";
import { useSubmit } from "./use-submit";

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
	navigateMock.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

function lastBlock() {
	const blocks = terminalStore.state.blocks;
	return blocks[blocks.length - 1];
}

describe("useSubmit — agent mode (existing)", () => {
	it("streams free text through /api/agent", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(
						sseBody([
							sseFrame("activity", { step: "reading", files: ["me.md"] }),
							sseFrame("token", "hi"),
							sseFrame("token", " there"),
							sseFrame("done", { tokens: 12 }),
						]),
						{ status: 200 },
					),
			);
		vi.stubGlobal("fetch", fetchMock);

		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("hello there");
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe("/api/agent");
		const blocks = terminalStore.state.blocks;
		expect(blocks.some((b) => b.kind === "activity")).toBe(true);
		const markdown = blocks.find((b) => b.kind === "markdown");
		expect(markdown && "text" in markdown && markdown.text).toBe("hi there");
	});

	it("runs slash commands in agent mode", async () => {
		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("/clear");
		});
		expect(terminalStore.state.blocks).toEqual([]);
	});
});

describe("useSubmit — shell mode", () => {
	beforeEach(() => {
		terminalStore.setState((s) => ({ ...s, mode: "shell" }));
	});

	it("dispatches to shell command registry", async () => {
		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("whoami");
		});
		expect(lastBlock()).toMatchObject({ kind: "output", text: "deep" });
	});

	it("`deep` flips back to agent mode and emits a system block", async () => {
		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("deep");
		});
		expect(terminalStore.state.mode).toBe("agent");
		expect(lastBlock()?.kind).toBe("system");
	});

	it("`claude` also flips back to agent mode", async () => {
		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("claude");
		});
		expect(terminalStore.state.mode).toBe("agent");
	});

	it("`open ui` navigates to /", async () => {
		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("open ui");
		});
		expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
	});

	it("slash commands in shell mode are command-not-found", async () => {
		const { result } = renderHook(() => useSubmit(), {
			wrapper: AgentTestWrapper,
		});
		await act(async () => {
			await result.current("/help");
		});
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("command not found"),
		});
	});
});
