import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pushHistory, terminalStore } from "#/store/terminal";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

// Import after mock so the hook resolves to the mocked navigate.
import { Prompt } from "./prompt";
import { abortAgentStream, isAgentStreaming } from "./use-agent-stream";

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
	abortAgentStream();
});

afterEach(() => {
	vi.restoreAllMocks();
});

function renderPrompt() {
	const onOpenPalette = vi.fn();
	const utils = render(<Prompt onOpenPalette={onOpenPalette} />);
	const input = utils.getByTestId("prompt-input") as HTMLTextAreaElement;
	return { ...utils, input, onOpenPalette };
}

describe("Prompt", () => {
	it("submits a slash command on Enter", async () => {
		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "/help" } });
		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
		});
		const kinds = terminalStore.state.blocks.map((b) => b.kind);
		// prompt block, then /help's output block
		expect(kinds[0]).toBe("prompt");
		expect(kinds[1]).toBe("output");
		expect(terminalStore.state.history).toEqual(["/help"]);
	});

	it("clears input after submit", async () => {
		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "/help" } });
		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
		});
		expect(input.value).toBe("");
	});

	it("streams an agent response for free text", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(
				async () =>
					new Response(
						sseBody([
							`event: token\ndata: ${JSON.stringify("hi back")}\n\n`,
							`event: done\ndata: ${JSON.stringify({ tokens: 2 })}\n\n`,
						]),
						{ status: 200 },
					),
			);
		vi.stubGlobal("fetch", fetchMock);

		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "hello there" } });
		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/agent",
			expect.objectContaining({ method: "POST" }),
		);
		const markdown = terminalStore.state.blocks.find(
			(b) => b.kind === "markdown",
		);
		expect(markdown && "text" in markdown && markdown.text).toBe("hi back");
	});

	it("Ctrl+C aborts an active stream", async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				const enc = new TextEncoder();
				controller.enqueue(
					enc.encode(`event: token\ndata: ${JSON.stringify("partial")}\n\n`),
				);
			},
		});
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockImplementation(async (_, init) => {
				const sig = (init as RequestInit | undefined)?.signal;
				sig?.addEventListener("abort", () => {
					stream.cancel("abort").catch(() => {});
				});
				return new Response(stream, { status: 200 });
			});
		vi.stubGlobal("fetch", fetchMock);

		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "long answer please" } });
		const pending = act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
			await new Promise((r) => setTimeout(r, 20));
		});
		await pending;
		expect(isAgentStreaming()).toBe(true);

		await act(async () => {
			fireEvent.keyDown(input, { key: "c", ctrlKey: true });
			await new Promise((r) => setTimeout(r, 20));
		});

		expect(isAgentStreaming()).toBe(false);
		const system = terminalStore.state.blocks.find(
			(b) => b.kind === "system" && b.text === "^C aborted",
		);
		expect(system).toBeDefined();
	});

	it("Ctrl+C is a no-op when no stream is active (so copy still works)", () => {
		const { input } = renderPrompt();
		// Should not throw, should not prevent default.
		const event = new KeyboardEvent("keydown", {
			key: "c",
			ctrlKey: true,
			bubbles: true,
			cancelable: true,
		});
		input.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});

	it("Shift+Enter does not submit", () => {
		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "line 1" } });
		fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
		expect(terminalStore.state.blocks).toEqual([]);
	});

	it("ArrowUp recalls history", () => {
		pushHistory("/foo");
		pushHistory("/bar");
		const { input } = renderPrompt();
		fireEvent.keyDown(input, { key: "ArrowUp" });
		expect(input.value).toBe("/bar");
		fireEvent.keyDown(input, { key: "ArrowUp" });
		expect(input.value).toBe("/foo");
		fireEvent.keyDown(input, { key: "ArrowDown" });
		expect(input.value).toBe("/bar");
		fireEvent.keyDown(input, { key: "ArrowDown" });
		expect(input.value).toBe("");
	});

	it("Ctrl+L clears the scrollback", () => {
		terminalStore.setState((s) => ({
			...s,
			blocks: [
				{
					id: "x",
					kind: "output" as const,
					text: "noise",
					ts: 0,
				},
			],
		}));
		const { input } = renderPrompt();
		fireEvent.keyDown(input, { key: "l", ctrlKey: true });
		expect(terminalStore.state.blocks).toEqual([]);
	});

	it("Ctrl+K asks to open the palette", () => {
		const { input, onOpenPalette } = renderPrompt();
		fireEvent.keyDown(input, { key: "k", ctrlKey: true });
		expect(onOpenPalette).toHaveBeenCalledTimes(1);
	});

	it("Tab autocompletes a unique prefix", () => {
		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "/he" } });
		fireEvent.keyDown(input, { key: "Tab" });
		expect(input.value).toBe("/help ");
	});

	it("/ui calls navigate", async () => {
		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "/ui" } });
		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
		});
		expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
	});
});
