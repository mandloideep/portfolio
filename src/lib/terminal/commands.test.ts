import { beforeEach, describe, expect, it, vi } from "vitest";
import { projects } from "#/content/site";
import { emit as _emit, pushHistory, terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";
import { autocomplete, parseInput, runCommand } from "./commands";
import { getCorpusEntry } from "./corpus";

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "agent",
		booted: false,
		cwd: "~",
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

	it.each([
		"/me",
		"/experience",
		"/skills",
		"/contact",
	] as const)("%s emits a markdown block matching the corpus file", async (cmd) => {
		await runCommand(cmd, { navigate: noopNavigate, submit: noopSubmit });
		const b = lastBlock();
		expect(b?.kind).toBe("markdown");
		const key = cmd.slice(1) as "me" | "experience" | "skills" | "contact";
		expect((b as { text: string }).text).toBe(getCorpusEntry(key));
	});

	it("/projects with no args lists every slug", async () => {
		await runCommand("/projects", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		const b = lastBlock();
		expect(b?.kind).toBe("output");
		const text = (b as { text: string }).text;
		for (const p of projects) {
			expect(text).toContain(p.slug);
		}
	});

	it("/projects <known-slug> emits a markdown block", async () => {
		await runCommand("/projects mydininghall", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		const b = lastBlock();
		expect(b?.kind).toBe("markdown");
		expect((b as { text: string }).text.startsWith("# ")).toBe(true);
	});

	it("/projects <unknown-slug> emits an error block, not a crash", async () => {
		await runCommand("/projects definitely-not-a-real-project", {
			navigate: noopNavigate,
			submit: noopSubmit,
		});
		const b = lastBlock();
		expect(b?.kind).toBe("error");
		expect((b as { text: string }).text).toMatch(/unknown project/);
	});

	it("/help lists the new content commands", async () => {
		await runCommand("/help", { navigate: noopNavigate, submit: noopSubmit });
		const text = (lastBlock() as { text: string }).text;
		for (const name of [
			"/me",
			"/experience",
			"/skills",
			"/contact",
			"/projects",
		]) {
			expect(text).toContain(name);
		}
	});

	it("/exit flips mode to shell and emits a system block", async () => {
		await runCommand("/exit", { navigate: noopNavigate, submit: noopSubmit });
		expect(terminalStore.state.mode).toBe("shell");
		expect(lastBlock()?.kind).toBe("system");
		expect((lastBlock() as { text: string }).text).toMatch(/shell|deep/i);
	});

	it("/help lists /exit", async () => {
		await runCommand("/help", { navigate: noopNavigate, submit: noopSubmit });
		const text = (lastBlock() as { text: string }).text;
		expect(text).toContain("/exit");
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
