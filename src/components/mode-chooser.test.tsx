import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModeChooser, UiStub } from "./mode-chooser";

describe("ModeChooser", () => {
	it("renders both options", () => {
		const onPick = vi.fn();
		const { getByTestId, getByText } = render(<ModeChooser onPick={onPick} />);
		expect(getByTestId("pick-ui")).toBeInTheDocument();
		expect(getByTestId("pick-terminal")).toBeInTheDocument();
		expect(getByText(/Browse the portfolio/)).toBeInTheDocument();
		expect(getByText(/Open terminal/)).toBeInTheDocument();
	});

	it("calls onPick with 'ui' when the UI card is clicked", () => {
		const onPick = vi.fn();
		const { getByTestId } = render(<ModeChooser onPick={onPick} />);
		fireEvent.click(getByTestId("pick-ui"));
		expect(onPick).toHaveBeenCalledWith("ui");
	});

	it("calls onPick with 'terminal' when the terminal card is clicked", () => {
		const onPick = vi.fn();
		const { getByTestId } = render(<ModeChooser onPick={onPick} />);
		fireEvent.click(getByTestId("pick-terminal"));
		expect(onPick).toHaveBeenCalledWith("terminal");
	});

	it("has an accessible heading", () => {
		const { container } = render(<ModeChooser onPick={() => {}} />);
		const heading = container.querySelector("#chooser-heading");
		expect(heading).toBeInTheDocument();
		expect(heading?.tagName).toBe("H1");
	});
});

describe("UiStub", () => {
	it("renders the phase-08 placeholder", () => {
		const { getByTestId } = render(<UiStub />);
		expect(getByTestId("ui-stub")).toBeInTheDocument();
		expect(getByTestId("ui-stub").textContent).toMatch(/phase 08/);
	});
});
