import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MagicCard } from "./magic-card";

vi.mock("next-themes", () => ({
	useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));

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

afterEach(() => {
	vi.restoreAllMocks();
});

describe("MagicCard reduced-motion guard", () => {
	it("renders a static, pointer-less variant when reduced motion is on", () => {
		mockMatchMedia(true);
		const { getByTestId, queryByText } = render(
			<MagicCard>
				<p>child</p>
			</MagicCard>,
		);
		const root = getByTestId("magic-card-static");
		expect(root.getAttribute("data-reduced")).toBe("true");
		expect(queryByText("child")).toBeInTheDocument();
		// Static variant should not have the pointer listeners — sanity-check
		// by confirming the dynamic root motion element isn't present.
		expect(root.querySelector("[data-framer-component-type]")).toBeNull();
	});

	it("renders the dynamic variant when reduced motion is off", () => {
		mockMatchMedia(false);
		const { queryByTestId } = render(
			<MagicCard>
				<p>child</p>
			</MagicCard>,
		);
		expect(queryByTestId("magic-card-static")).toBeNull();
	});
});
