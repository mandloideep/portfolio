import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModeChooser } from "./mode-chooser";

describe("ModeChooser", () => {
	it("renders all three options", () => {
		const onPick = vi.fn();
		const { getByTestId, getByText } = render(<ModeChooser onPick={onPick} />);
		expect(getByTestId("pick-ui")).toBeInTheDocument();
		expect(getByTestId("pick-chat")).toBeInTheDocument();
		expect(getByTestId("pick-terminal")).toBeInTheDocument();
		expect(getByText(/Browse the portfolio/)).toBeInTheDocument();
		expect(getByText(/Chat with the agent/)).toBeInTheDocument();
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

	it("calls onPick with 'chat' when the chat card is clicked", () => {
		const onPick = vi.fn();
		const { getByTestId } = render(<ModeChooser onPick={onPick} />);
		fireEvent.click(getByTestId("pick-chat"));
		expect(onPick).toHaveBeenCalledWith("chat");
	});

	it("renders switch chips for the two non-current modes when a mode is remembered", () => {
		const onPick = vi.fn();
		const { getByTestId, queryByTestId } = render(
			<ModeChooser onPick={onPick} currentMode="chat" />,
		);
		// active mode is not offered as a switch chip
		expect(queryByTestId("chooser-toggle-chat")).toBeNull();
		// the other two are
		fireEvent.click(getByTestId("chooser-toggle-ui"));
		expect(onPick).toHaveBeenCalledWith("ui");
		fireEvent.click(getByTestId("chooser-toggle-terminal"));
		expect(onPick).toHaveBeenCalledWith("terminal");
	});

	it("has an accessible heading", () => {
		const { container } = render(<ModeChooser onPick={() => {}} />);
		const heading = container.querySelector("#chooser-heading");
		expect(heading).toBeInTheDocument();
		expect(heading?.tagName).toBe("H1");
	});
});
