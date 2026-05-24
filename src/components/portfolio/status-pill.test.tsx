import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./status-pill";

describe("StatusPill", () => {
	it("renders the status string verbatim", () => {
		const { getByText } = render(<StatusPill status="open to work" />);
		expect(getByText("open to work")).toBeInTheDocument();
	});

	it("uses an <output> element so it has implicit role=status", () => {
		const { getByRole } = render(<StatusPill status="x" />);
		const el = getByRole("status");
		expect(el.tagName).toBe("OUTPUT");
		expect(el.textContent).toContain("x");
	});
});
