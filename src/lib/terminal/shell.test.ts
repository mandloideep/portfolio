import { beforeEach, describe, expect, it, vi } from "vitest";
import { projects } from "#/content/site";
import { setCwd, setMode, terminalStore } from "#/store/terminal";
import { getCorpusEntry } from "./corpus";
import { runShellCommand, shellCommands } from "./shell";
import { HOME } from "./shell-vfs";

beforeEach(() => {
	window.localStorage.clear();
	terminalStore.setState(() => ({
		blocks: [],
		history: [],
		historyCursor: null,
		mode: "shell",
		booted: true,
		cwd: HOME,
	}));
});

const navigate = vi.fn();
const deps = { navigate };

function lastBlock() {
	const blocks = terminalStore.state.blocks;
	return blocks[blocks.length - 1];
}

function blockTexts(): string[] {
	return terminalStore.state.blocks.map((b) => ("text" in b ? b.text : ""));
}

describe("pwd", () => {
	it("prints home initially", () => {
		runShellCommand("pwd", deps);
		expect(lastBlock()).toMatchObject({ kind: "output", text: HOME });
	});

	it("prints the updated cwd after cd", () => {
		setCwd(`${HOME}/projects`);
		runShellCommand("pwd", deps);
		expect(lastBlock()).toMatchObject({
			kind: "output",
			text: `${HOME}/projects`,
		});
	});
});

describe("ls", () => {
	it("lists home contents with dirs trailing /", () => {
		runShellCommand("ls", deps);
		const out = lastBlock();
		expect(out?.kind).toBe("output");
		const text = "text" in (out ?? {}) ? (out as { text: string }).text : "";
		expect(text).toContain("projects/");
		expect(text).toContain("facts/");
		expect(text).toContain("me.md");
	});

	it("lists a relative subdirectory", () => {
		runShellCommand("ls projects", deps);
		const out = lastBlock();
		const text = "text" in (out ?? {}) ? (out as { text: string }).text : "";
		for (const p of projects) {
			expect(text).toContain(`${p.slug}.md`);
		}
	});

	it("errors on a missing path", () => {
		runShellCommand("ls does-not-exist", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("no such file or directory"),
		});
	});
});

describe("cd", () => {
	it("moves into a subdirectory", () => {
		runShellCommand("cd projects", deps);
		expect(terminalStore.state.cwd).toBe(`${HOME}/projects`);
	});

	it("cd .. returns to parent", () => {
		setCwd(`${HOME}/projects`);
		runShellCommand("cd ..", deps);
		expect(terminalStore.state.cwd).toBe(HOME);
	});

	it("cd with no args returns home", () => {
		setCwd(`${HOME}/projects`);
		runShellCommand("cd", deps);
		expect(terminalStore.state.cwd).toBe(HOME);
	});

	it("cd ~ and cd / both return home", () => {
		setCwd(`${HOME}/projects`);
		runShellCommand("cd ~", deps);
		expect(terminalStore.state.cwd).toBe(HOME);
		setCwd(`${HOME}/projects`);
		runShellCommand("cd /", deps);
		expect(terminalStore.state.cwd).toBe(HOME);
	});

	it("errors when target does not exist", () => {
		runShellCommand("cd nowhere", deps);
		expect(terminalStore.state.cwd).toBe(HOME);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("no such file or directory"),
		});
	});

	it("errors when target is a file", () => {
		runShellCommand("cd me.md", deps);
		expect(terminalStore.state.cwd).toBe(HOME);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("not a directory"),
		});
	});
});

describe("cat", () => {
	it("emits a markdown block matching the corpus", () => {
		runShellCommand("cat me.md", deps);
		expect(lastBlock()).toMatchObject({
			kind: "markdown",
			text: getCorpusEntry("me"),
		});
	});

	it("errors on missing file", () => {
		runShellCommand("cat ghost.md", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("no such file"),
		});
	});

	it("errors when target is a directory", () => {
		runShellCommand("cat projects", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("is a directory"),
		});
	});

	it("errors on missing operand", () => {
		runShellCommand("cat", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("missing file operand"),
		});
	});
});

describe("echo / whoami / date", () => {
	it("echo joins args with a space", () => {
		runShellCommand("echo hello there friend", deps);
		expect(lastBlock()).toMatchObject({
			kind: "output",
			text: "hello there friend",
		});
	});

	it("whoami prints deep", () => {
		runShellCommand("whoami", deps);
		expect(lastBlock()).toMatchObject({ kind: "output", text: "deep" });
	});

	it("date contains the current year", () => {
		const year = String(new Date().getFullYear());
		runShellCommand("date", deps);
		expect(lastBlock()).toMatchObject({
			kind: "output",
			text: expect.stringContaining(year),
		});
	});
});

describe("history / clear / help", () => {
	it("history prints the saved lines numbered from 1", () => {
		terminalStore.setState((s) => ({ ...s, history: ["one", "two"] }));
		runShellCommand("history", deps);
		const last = lastBlock();
		const text = "text" in (last ?? {}) ? (last as { text: string }).text : "";
		expect(text).toContain("1");
		expect(text).toContain("one");
		expect(text).toContain("2");
		expect(text).toContain("two");
	});

	it("history is empty hint when no history", () => {
		runShellCommand("history", deps);
		expect(lastBlock()).toMatchObject({
			kind: "output",
			text: expect.stringContaining("no history"),
		});
	});

	it("clear drops all blocks", () => {
		runShellCommand("echo first", deps);
		expect(terminalStore.state.blocks.length).toBeGreaterThan(0);
		runShellCommand("clear", deps);
		expect(terminalStore.state.blocks).toEqual([]);
	});

	it("help lists every visible command", () => {
		runShellCommand("help", deps);
		const text = blockTexts().join("\n");
		for (const c of shellCommands.filter((cmd) => !cmd.hidden)) {
			expect(text).toContain(c.name);
		}
	});
});

describe("joke commands", () => {
	it("neofetch emits non-empty multi-line output", () => {
		runShellCommand("neofetch", deps);
		const last = lastBlock();
		const text = "text" in (last ?? {}) ? (last as { text: string }).text : "";
		expect(text.length).toBeGreaterThan(20);
		expect(text).toContain("deep@portfolio");
	});

	it("uname prints portfolio-os", () => {
		runShellCommand("uname", deps);
		expect(lastBlock()).toMatchObject({
			kind: "output",
			text: expect.stringContaining("portfolio-os"),
		});
	});

	it("uname -a prints the long line", () => {
		runShellCommand("uname -a", deps);
		expect(lastBlock()).toMatchObject({
			kind: "output",
			text: expect.stringContaining("deep-kernel"),
		});
	});

	it("sudo emits the sudoers error", () => {
		runShellCommand("sudo rm -rf /", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("sudoers"),
		});
	});

	it("vim references quitting", () => {
		runShellCommand("vim", deps);
		const last = lastBlock();
		const text = "text" in (last ?? {}) ? (last as { text: string }).text : "";
		expect(text.toLowerCase()).toMatch(/:q|escape|quit|give up/);
	});

	it("nano scolds the user", () => {
		runShellCommand("nano", deps);
		const last = lastBlock();
		const text = "text" in (last ?? {}) ? (last as { text: string }).text : "";
		expect(text.toLowerCase()).toContain("nano");
	});
});

describe("unknown commands", () => {
	it("emits command not found", () => {
		runShellCommand("fizzbuzz", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("command not found"),
		});
	});

	it("treats slash commands as not found (per spec, slash disabled in shell)", () => {
		runShellCommand("/help", deps);
		expect(lastBlock()).toMatchObject({
			kind: "error",
			text: expect.stringContaining("command not found"),
		});
	});

	it("ignores empty input", () => {
		runShellCommand("   ", deps);
		expect(terminalStore.state.blocks).toEqual([]);
	});
});

describe("setMode cwd reset", () => {
	it("resets cwd to home when switching to agent", () => {
		setCwd(`${HOME}/projects`);
		setMode("agent");
		expect(terminalStore.state.cwd).toBe(HOME);
	});

	it("preserves cwd when re-entering shell", () => {
		setCwd(`${HOME}/projects`);
		setMode("shell");
		expect(terminalStore.state.cwd).toBe(`${HOME}/projects`);
	});
});
