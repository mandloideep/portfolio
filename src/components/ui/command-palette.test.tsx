import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	CommandPaletteDialog,
	type PaletteAction,
} from "./command-palette";

function makeActions(): PaletteAction[] {
	return [
		{
			id: "hello",
			label: "Say hello",
			hint: "greeting",
			group: "demo",
			perform: vi.fn(),
		},
		{
			id: "yell",
			label: "Yell hello loudly",
			group: "demo",
			perform: vi.fn(),
		},
		{
			id: "navigate",
			label: "Open projects",
			hint: "/projects",
			group: "navigate",
			keywords: ["work"],
			perform: vi.fn(),
		},
	];
}

describe("CommandPaletteDialog", () => {
	it("renders all actions when no query", () => {
		const actions = makeActions();
		const { getByTestId } = render(
			<CommandPaletteDialog
				open
				onOpenChange={() => {}}
				actions={actions}
			/>,
		);
		expect(getByTestId("palette-item-hello")).toBeInTheDocument();
		expect(getByTestId("palette-item-yell")).toBeInTheDocument();
		expect(getByTestId("palette-item-navigate")).toBeInTheDocument();
	});

	it("filters by label prefix first, then by keyword/hint", () => {
		const actions = makeActions();
		const { getByTestId, queryByTestId } = render(
			<CommandPaletteDialog
				open
				onOpenChange={() => {}}
				actions={actions}
			/>,
		);
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "hello" } });
		// "Say hello" + "Yell hello loudly" both match; both visible.
		expect(getByTestId("palette-item-hello")).toBeInTheDocument();
		expect(getByTestId("palette-item-yell")).toBeInTheDocument();
		// "Open projects" doesn't mention hello.
		expect(queryByTestId("palette-item-navigate")).toBeNull();
	});

	it("Enter fires the active action and closes the dialog", () => {
		const actions = makeActions();
		const onOpenChange = vi.fn();
		const { getByTestId } = render(
			<CommandPaletteDialog
				open
				onOpenChange={onOpenChange}
				actions={actions}
			/>,
		);
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.keyDown(input, { key: "Enter" });
		expect(actions[0]?.perform).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("renders group headers when present", () => {
		const actions = makeActions();
		const { getByTestId } = render(
			<CommandPaletteDialog
				open
				onOpenChange={() => {}}
				actions={actions}
			/>,
		);
		expect(getByTestId("palette-group-demo")).toBeInTheDocument();
		expect(getByTestId("palette-group-navigate")).toBeInTheDocument();
	});

	it("shows emptyMessage when nothing matches", () => {
		const { getByTestId, getByText } = render(
			<CommandPaletteDialog
				open
				onOpenChange={() => {}}
				actions={makeActions()}
				emptyMessage="no matches"
			/>,
		);
		const input = getByTestId("palette-input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "xyz123" } });
		expect(getByText("no matches")).toBeInTheDocument();
	});
});
