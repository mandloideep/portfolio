import { beforeEach, describe, expect, it, vi } from "vitest";
import { emit as _emit, pushHistory, terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";
import { autocomplete, parseInput, runCommand } from "./commands";

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
	}));
	themeStore.setState(() => ({ slug: "nord-green" }));
});

function lastBlock() {
	const blocks = terminalStore.state.blocks;
	return blocks[blocks.length - 1];
}

const noopNavigate = vi.fn();
const noopSubmit = vi.fn();

describe("parseInput", () => {
	it("returns null for non-slash input", () => {
		expect(parseInput("hello world")).toBeNull();
	});

	it("splits name and args", () => {
		expect(parseInput("/theme dracula")).toEqual({
			name: "/theme",
			args: ["dracula"],
		});
	});
});

describe("autocomplete", () => {
	it("returns matching command names", () => {
		expect(autocomplete("/he")).toEqual(["/help"]);
	});

	it("returns empty for non-slash prefix", () => {
		expect(autocomplete("help")).toEqual([]);
	});

	it("returns multiple matches", () => {
		const matches = autocomplete("/");
		expect(matches.length).toBeGreaterThan(2);
		expect(matches).toContain("/help");
		expect(matches).toContain("/clear");
	});
});

describe("runCommand", () => {
	it("returns false for free text", async () => {
		const handled = await runCommand("hello", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect(handled).toBe(false);
	});

	it("emits error for unknown slash command", async () => {
		const handled = await runCommand("/bogus", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect(handled).toBe(true);
		expect(lastBlock()?.kind).toBe("error");
	});

	it("/help lists commands", async () => {
		await runCommand("/help", { navigate: noopNavigate, submit: noopSubmit });
		const b = lastBlock();
		expect(b?.kind).toBe("output");
		expect("text" in (b ?? {}) && (b as { text: string }).text).toMatch(
			/\/help/,
		);
	});

	it("/clear empties scrollback", async () => {
		_emit("output", "x");
		_emit("output", "y");
		await runCommand("/clear", { navigate: noopNavigate, submit: noopSubmit });
		expect(terminalStore.state.blocks).toEqual([]);
	});

	it("/history shows '(no history yet)' when empty", async () => {
		await runCommand("/history", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect((lastBlock() as { text: string }).text).toMatch(/no history yet/);
	});

	it("/history dumps numbered entries", async () => {
		pushHistory("/foo");
		pushHistory("/bar");
		await runCommand("/history", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		const text = (lastBlock() as { text: string }).text;
		expect(text).toMatch(/1.*\/foo/);
		expect(text).toMatch(/2.*\/bar/);
	});

	it("/ui navigates to /", async () => {
		const navigate = vi.fn();
		await runCommand("/ui", { navigate, submit: noopSubmit });
		expect(navigate).toHaveBeenCalledWith({ to: "/" });
	});

	it("/theme with no args lists themes", async () => {
		await runCommand("/theme", { navigate: noopNavigate, submit: noopSubmit });
		const text = (lastBlock() as { text: string }).text;
		expect(text).toMatch(/dracula/);
		expect(text).toMatch(/nord-green/);
	});

	it("/theme <slug> sets and persists", async () => {
		await runCommand("/theme dracula", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect(themeStore.state.slug).toBe("dracula");
		const b = lastBlock();
		expect(b?.kind).toBe("output");
	});

	it("/theme bogus emits an error", async () => {
		await runCommand("/theme bogus", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect(lastBlock()?.kind).toBe("error");
		expect(themeStore.state.slug).toBe("nord-green");
	});

	it("/retry replays the most recent non-/retry line", async () => {
		pushHistory("/help");
		pushHistory("/retry");
		const submit = vi.fn();
		await runCommand("/retry", { navigate: noopNavigate, submit });
		expect(submit).toHaveBeenCalledWith("/help");
	});

	it("/retry errors when there is nothing to retry", async () => {
		await runCommand("/retry", { navigate: noopNavigate, submit: noopSubmit });
		expect(lastBlock()?.kind).toBe("error");
	});

	it("/github + /resume open links (smoke)", async () => {
		// jsdom .click() on an <a target=_blank> won't open a window, but the
		// system block + the side-effect (anchor was created) is what we assert.
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
		await runCommand("/github", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect(clickSpy).toHaveBeenCalled();
		await runCommand("/resume", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		expect(clickSpy).toHaveBeenCalledTimes(2);
		clickSpy.mockRestore();
	});
});
