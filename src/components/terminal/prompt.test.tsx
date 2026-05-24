import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pushHistory, terminalStore } from "#/store/terminal";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

// Import after mock so the hook resolves to the mocked navigate.
import { Prompt } from "./prompt";

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

	it("emits placeholder system block for free text", async () => {
		const { input } = renderPrompt();
		fireEvent.change(input, { target: { value: "hello there" } });
		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
		});
		const last = terminalStore.state.blocks.at(-1);
		expect(last?.kind).toBe("system");
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
