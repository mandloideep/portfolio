import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedBackground } from "./animated-background";

function mockMatchMedia(reduced: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: reduced && query.includes("reduced"),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

beforeEach(() => {
	mockMatchMedia(false);
});

describe("AnimatedBackground", () => {
	it("renders a fixed background layer", () => {
		const { getByTestId } = render(<AnimatedBackground />);
		const layer = getByTestId("animated-background");
		expect(layer.className).toMatch(/fixed/);
		expect(layer.className).toMatch(/-z-10/);
		expect(layer.getAttribute("aria-hidden")).toBe("true");
	});

	it("marks reduced=false by default", () => {
		const { getByTestId } = render(<AnimatedBackground />);
		expect(getByTestId("animated-background").dataset.reduced).toBe("false");
	});

	it("respects prefers-reduced-motion by flipping data-reduced", () => {
		mockMatchMedia(true);
		const { getByTestId } = render(<AnimatedBackground />);
		expect(getByTestId("animated-background").dataset.reduced).toBe("true");
	});
});
