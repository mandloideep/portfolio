import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import { terminalStore } from "#/store/terminal";

// biome-ignore lint/suspicious/noExplicitAny: vitest-axe matchers shape varies between vitest majors
expect.extend(matchers as any);

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
		"@tanstack/react-router",
	);
	return {
		...actual,
		useNavigate: () => vi.fn(),
		useSearch: () => ({}),
		useRouterState: () => "/terminal",
		createFileRoute: () => () => ({}),
		Link: ({
			children,
			to,
			...rest
		}: React.PropsWithChildren<{ to?: string } & Record<string, unknown>>) => (
			<a href={to as string} {...(rest as Record<string, string>)}>
				{children}
			</a>
		),
	};
});

import { TerminalShell } from "#/components/terminal/terminal-shell";

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: true,
		cwd: "~",
	}));
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		configurable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
	// Keep any in-flight fetch (corpus, agent, etc.) hanging so the axe run
	// only sees the static shell.
	vi.stubGlobal(
		"fetch",
		vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {})),
	);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Terminal a11y", () => {
	it("has no axe violations", async () => {
		const { container } = render(<TerminalShell />);
		const results = await axe(container);
		// biome-ignore lint/suspicious/noExplicitAny: matcher added via expect.extend
		(expect(results) as any).toHaveNoViolations();
	});
});
