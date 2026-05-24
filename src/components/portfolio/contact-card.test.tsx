import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { siteMeta } from "#/content/site";

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

import { ContactCard } from "./contact-card";

beforeEach(() => {
	navigateMock.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("ContactCard", () => {
	it("renders an email mailto link", () => {
		const { getByTestId } = render(<ContactCard />);
		expect(getByTestId("contact-email").getAttribute("href")).toBe(
			`mailto:${siteMeta.email}`,
		);
	});

	it("renders github and linkedin links as external", () => {
		const { getByTestId } = render(<ContactCard />);
		const github = getByTestId("contact-github");
		const linkedin = getByTestId("contact-linkedin");
		expect(github.getAttribute("href")).toBe(siteMeta.links.github);
		expect(linkedin.getAttribute("href")).toBe(siteMeta.links.linkedin);
		expect(github.getAttribute("target")).toBe("_blank");
		expect(linkedin.getAttribute("target")).toBe("_blank");
		expect(github.getAttribute("rel")).toContain("noreferrer");
		expect(linkedin.getAttribute("rel")).toContain("noreferrer");
	});

	it("shows the press-t hint badge", () => {
		const { getByText } = render(<ContactCard />);
		expect(getByText("press t")).toBeInTheDocument();
	});

	it("routes to /terminal when t is pressed on the window", () => {
		render(<ContactCard />);
		const event = new KeyboardEvent("keydown", { key: "t", bubbles: true });
		window.dispatchEvent(event);
		expect(navigateMock).toHaveBeenCalledTimes(1);
		expect(navigateMock).toHaveBeenCalledWith({ to: "/terminal" });
	});

	it("ignores t when an input is focused", () => {
		const { container } = render(<ContactCard />);
		const input = document.createElement("input");
		container.appendChild(input);
		input.focus();
		input.dispatchEvent(
			new KeyboardEvent("keydown", { key: "t", bubbles: true }),
		);
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("ignores t when modifier keys are held", () => {
		render(<ContactCard />);
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "t", ctrlKey: true, bubbles: true }),
		);
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "t", metaKey: true, bubbles: true }),
		);
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("ignores t when a Radix dialog is open", () => {
		render(<ContactCard />);
		const dialog = document.createElement("div");
		dialog.setAttribute("role", "dialog");
		dialog.setAttribute("data-state", "open");
		document.body.appendChild(dialog);
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "t", bubbles: true }),
		);
		expect(navigateMock).not.toHaveBeenCalled();
		document.body.removeChild(dialog);
	});

	it("detaches the keydown listener on unmount", () => {
		const { unmount } = render(<ContactCard />);
		unmount();
		window.dispatchEvent(
			new KeyboardEvent("keydown", { key: "t", bubbles: true }),
		);
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("opens the terminal when the terminal CTA button is clicked", () => {
		const { getByTestId } = render(<ContactCard />);
		fireEvent.click(getByTestId("contact-terminal"));
		expect(navigateMock).toHaveBeenCalledWith({ to: "/terminal" });
	});
});
