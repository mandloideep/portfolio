/**
 * Shell-mode command registry. Reached from the agent-mode `/exit` command;
 * leave shell mode by typing `deep` or `claude` (handled upstream in
 * `use-submit.ts` before dispatch).
 *
 * Unknown commands emit `command not found`. Slash commands typed in shell
 * mode aren't special-cased — they fall through here and produce the same
 * not-found message, matching the spec ("slash commands disabled in shell").
 */

import type { Navigate } from "#/lib/terminal/commands";
import { formatTwoCol } from "#/lib/terminal/format";
import {
	HOME,
	listDir,
	lookupNode,
	resolvePath,
} from "#/lib/terminal/shell-vfs";
import { clearBlocks, emit, setCwd, terminalStore } from "#/store/terminal";
import { themeStore } from "#/store/theme";

export type ShellContext = {
	args: string[];
	raw: string;
	navigate: Navigate;
};

export type ShellCommand = {
	name: string;
	description: string;
	hidden?: boolean;
	handler: (ctx: ShellContext) => void;
};

// ─── Real commands ──────────────────────────────────────────────────────

const pwd: ShellCommand = {
	name: "pwd",
	description: "print working directory",
	handler: () => {
		emit("output", terminalStore.state.cwd);
	},
};

const ls: ShellCommand = {
	name: "ls",
	description: "list directory contents",
	handler: ({ args }) => {
		const target = resolvePath(terminalStore.state.cwd, args[0] ?? "");
		const node = lookupNode(target);
		if (!node) {
			emit("error", `ls: no such file or directory: ${args[0] ?? target}`);
			return;
		}
		if (node.kind === "file") {
			emit("output", node.name);
			return;
		}
		const entries = listDir(node);
		if (entries.length === 0) {
			emit("output", "(empty)");
			return;
		}
		emit("output", entries.join("  "));
	},
};

const cd: ShellCommand = {
	name: "cd",
	description: "change directory",
	handler: ({ args }) => {
		const arg = args[0] ?? HOME;
		const target = resolvePath(terminalStore.state.cwd, arg);
		const node = lookupNode(target);
		if (!node) {
			emit("error", `cd: no such file or directory: ${arg}`);
			return;
		}
		if (node.kind !== "dir") {
			emit("error", `cd: not a directory: ${arg}`);
			return;
		}
		setCwd(target);
	},
};

const cat: ShellCommand = {
	name: "cat",
	description: "print file contents",
	handler: ({ args }) => {
		if (args.length === 0) {
			emit("error", "cat: missing file operand");
			return;
		}
		for (const arg of args) {
			const target = resolvePath(terminalStore.state.cwd, arg);
			const node = lookupNode(target);
			if (!node) {
				emit("error", `cat: ${arg}: no such file or directory`);
				continue;
			}
			if (node.kind !== "file") {
				emit("error", `cat: ${arg}: is a directory`);
				continue;
			}
			emit("markdown", node.content);
		}
	},
};

const echo: ShellCommand = {
	name: "echo",
	description: "print a line",
	handler: ({ args }) => {
		emit("output", args.join(" "));
	},
};

const whoami: ShellCommand = {
	name: "whoami",
	description: "print effective user",
	handler: () => {
		emit("output", "deep");
	},
};

const date: ShellCommand = {
	name: "date",
	description: "print current date",
	handler: () => {
		emit("output", new Date().toString());
	},
};

const historyCmd: ShellCommand = {
	name: "history",
	description: "show recent prompt history",
	handler: () => {
		const h = terminalStore.state.history;
		if (h.length === 0) {
			emit("output", "(no history yet)");
			return;
		}
		const numbered = h.map(
			(line, i) => `  ${String(i + 1).padStart(3, " ")}  ${line}`,
		);
		emit("output", numbered.join("\n"));
	},
};

const clearCmd: ShellCommand = {
	name: "clear",
	description: "clear the scrollback",
	handler: () => {
		clearBlocks();
	},
};

const helpCmd: ShellCommand = {
	name: "help",
	description: "list available shell commands",
	handler: () => {
		const visible = shellCommands.filter((c) => !c.hidden);
		emit(
			"output",
			`shell commands:\n${formatTwoCol(visible.map((c) => [c.name, c.description]))}\n\nleave shell: type 'deep' or 'claude'. open ui: 'open ui'.`,
		);
	},
};

// ─── Joke commands ──────────────────────────────────────────────────────

const neofetch: ShellCommand = {
	name: "neofetch",
	description: "show system info",
	handler: () => {
		const theme = themeStore.state.slug;
		const uptime = `${Math.max(1, Math.round(performance.now() / 1000))}s`;
		const art = [
			"       _.._",
			"      ( () )         deep@portfolio",
			"       \\__/          --------------",
			"       /  \\          os:     portfolio-os 1.0 (terminal edition)",
			"      / /\\ \\         shell:  /bin/deep",
			"     | |  | |        editor: cursor (sometimes vim, never nano)",
			`      \\ \\/ /         uptime: ${uptime} since last redeploy`,
			`       \\__/          theme:  ${theme}`,
		].join("\n");
		emit("output", art);
	},
};

const uname: ShellCommand = {
	name: "uname",
	description: "print kernel name",
	handler: ({ args }) => {
		if (args.includes("-a")) {
			emit("output", "portfolio-os deep 1.0 deep-kernel #1 SMP x86_64");
			return;
		}
		emit("output", "portfolio-os");
	},
};

const sudo: ShellCommand = {
	name: "sudo",
	description: "execute as superuser",
	handler: () => {
		emit(
			"error",
			"deep is not in the sudoers file. this incident will be logged.",
		);
	},
};

const vim: ShellCommand = {
	name: "vim",
	description: "edit a file (allegedly)",
	handler: () => {
		emit(
			"output",
			"E37: this isn't really vim. press :q! to give up, or just type 'deep' to escape.",
		);
	},
};

const nano: ShellCommand = {
	name: "nano",
	description: "edit a file (kindly)",
	handler: () => {
		emit("output", "[ no nano in this house. use vim. or don't. ]");
	},
};

// ─── Registry + dispatch ────────────────────────────────────────────────

export const shellCommands: ShellCommand[] = [
	pwd,
	ls,
	cd,
	cat,
	echo,
	whoami,
	date,
	historyCmd,
	clearCmd,
	helpCmd,
	neofetch,
	uname,
	sudo,
	vim,
	nano,
];

export function parseShellInput(
	raw: string,
): { name: string; args: string[] } | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const parts = trimmed.split(/\s+/);
	const name = parts[0] ?? "";
	return { name, args: parts.slice(1) };
}

export function findShellCommand(name: string): ShellCommand | undefined {
	return shellCommands.find((c) => c.name === name);
}

/**
 * Dispatch a shell-mode line. Re-entry shortcuts (`deep`, `claude`,
 * `open ui`) are handled by `use-submit.ts` BEFORE this is called, since
 * they cross the mode/route boundary.
 */
export function runShellCommand(
	raw: string,
	deps: { navigate: Navigate },
): void {
	const parsed = parseShellInput(raw);
	if (!parsed) return;
	const cmd = findShellCommand(parsed.name);
	if (!cmd) {
		emit("error", `${parsed.name}: command not found`);
		return;
	}
	cmd.handler({ args: parsed.args, raw, navigate: deps.navigate });
}
