import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandHint } from "./command-hint";

describe("CommandHint", () => {
	it("calls onOpen when clicked", () => {
		const onOpen = vi.fn();
		const { getByTestId } = render(<CommandHint onOpen={onOpen} />);
		fireEvent.click(getByTestId("command-hint"));
		expect(onOpen).toHaveBeenCalledTimes(1);
	});

	it("renders a glyph", () => {
		const { getByTestId } = render(<CommandHint onOpen={() => {}} />);
		const chip = getByTestId("command-hint");
		const text = chip.textContent ?? "";
		expect(/⌘K|Ctrl K/.test(text)).toBe(true);
	});
});
