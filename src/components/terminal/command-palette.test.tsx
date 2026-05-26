import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { terminalStore } from "#/store/terminal";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

import { AgentTestWrapper } from "#/components/agent/test-utils";
import { CommandPalette } from "./command-palette";

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
});

function renderPalette(open = true) {
	const onOpenChange = vi.fn();
	const utils = render(
		<CommandPalette open={open} onOpenChange={onOpenChange} />,
		{ wrapper: AgentTestWrapper },
	);
	return { ...utils, onOpenChange };
}

describe("CommandPalette", () => {
	it("lists all commands when open and empty", () => {
		const { getAllByRole } = renderPalette();
		const items = getAllByRole("button").filter((b) =>
			b.getAttribute("data-testid")?.startsWith("palette-item-"),
		);
		expect(items.length).toBeGreaterThan(2);
	});

	it("filters by query", () => {
		const { getByTestId, queryByTestId } = renderPalette();
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "the" } });
		expect(getByTestId("palette-item-theme")).toBeInTheDocument();
		expect(queryByTestId("palette-item-help")).toBeNull();
	});

	it("Enter submits the active command and closes", async () => {
		const { getByTestId, onOpenChange } = renderPalette();
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "help" } });
		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter" });
		});
		expect(onOpenChange).toHaveBeenCalledWith(false);
		const kinds = terminalStore.state.blocks.map((b) => b.kind);
		expect(kinds[0]).toBe("prompt");
		expect(kinds[1]).toBe("output"); // /help output
	});

	it("clicking an item submits it", async () => {
		const { getByTestId, onOpenChange } = renderPalette();
		await act(async () => {
			fireEvent.click(getByTestId("palette-item-clear"));
		});
		expect(onOpenChange).toHaveBeenCalledWith(false);
		// /clear empties blocks — but the prompt block is added then /clear runs.
		// End state: blocks empty.
		expect(terminalStore.state.blocks).toEqual([]);
	});

	it("ArrowDown / ArrowUp move active highlight", () => {
		const { getByTestId } = renderPalette();
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.keyDown(input, { key: "ArrowDown" });
		fireEvent.keyDown(input, { key: "ArrowDown" });
		fireEvent.keyDown(input, { key: "ArrowUp" });
		// Smoke: doesn't throw, palette stays open.
		expect(input).toBeInTheDocument();
	});

	it("shows 'no commands match' when query has no hits", () => {
		const { getByTestId, getByText } = renderPalette();
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "zzzzzzz" } });
		expect(getByText(/no commands match/)).toBeInTheDocument();
	});
});
