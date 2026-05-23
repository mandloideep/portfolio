import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { makeBlock } from "#/lib/terminal/blocks";
import { appendBlock, terminalStore } from "#/store/terminal";
import { Scrollback } from "./scrollback";

beforeEach(() => {
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
	}));
});

describe("Scrollback", () => {
	it("renders blocks from the store", () => {
		appendBlock(makeBlock("output", { text: "alpha" }));
		appendBlock(makeBlock("output", { text: "beta" }));
		const { getByTestId } = render(<Scrollback />);
		const el = getByTestId("scrollback");
		expect(el.textContent).toMatch(/alpha/);
		expect(el.textContent).toMatch(/beta/);
	});

	it("exposes ARIA log role for screen readers", () => {
		const { getByTestId } = render(<Scrollback />);
		const el = getByTestId("scrollback");
		expect(el.getAttribute("role")).toBe("log");
		expect(el.getAttribute("aria-live")).toBe("polite");
	});

	it("rerenders when new blocks arrive", () => {
		const { getByTestId } = render(<Scrollback />);
		const el = getByTestId("scrollback");
		expect(el.textContent).toBe("");
		act(() => {
			appendBlock(makeBlock("output", { text: "later" }));
		});
		expect(el.textContent).toMatch(/later/);
	});
});
