import { siteMeta } from "#/content/site";
import { isThemeSlug, type ThemeSlug, themes } from "#/content/themes";
import { makeBlock } from "#/lib/terminal/blocks";
import {
	appendBlock,
	clearBlocks,
	emit,
	terminalStore,
} from "#/store/terminal";
import { setTheme } from "#/store/theme";

export type Navigate = (opts: { to: string }) => void;

export type CommandContext = {
	args: string[];
	raw: string;
	navigate: Navigate;
	/**
	 * Re-submit a line as if the user typed it. Wired by the prompt component
	 * so commands like /retry can drive the same handler pipeline.
	 */
	submit: (line: string) => void;
};

export type Command = {
	name: string;
	description: string;
	hidden?: boolean;
	handler: (ctx: CommandContext) => void | Promise<void>;
};

// ─── Helpers ────────────────────────────────────────────────────────────

function openExternal(url: string): void {
	if (typeof window === "undefined") return;
	const a = document.createElement("a");
	a.href = url;
	a.target = "_blank";
	a.rel = "noopener noreferrer";
	document.body.appendChild(a);
	a.click();
	a.remove();
}

function formatTwoCol(rows: Array<[string, string]>): string {
	const width = Math.max(...rows.map(([a]) => a.length));
	return rows.map(([a, b]) => `  ${a.padEnd(width, " ")}  ${b}`).join("\n");
}

// ─── Commands ───────────────────────────────────────────────────────────

const help: Command = {
	name: "/help",
	description: "list available commands",
	handler: () => {
		const visible = commands.filter((c) => !c.hidden);
		emit(
			"output",
			`available commands:\n${formatTwoCol(visible.map((c) => [c.name, c.description]))}`,
		);
	},
};

const clear: Command = {
	name: "/clear",
	description: "clear the scrollback",
	handler: () => {
		clearBlocks();
	},
};

const history: Command = {
	name: "/history",
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

const retry: Command = {
	name: "/retry",
	description: "re-run the most recent non-/retry line",
	handler: ({ submit }) => {
		const h = terminalStore.state.history;
		for (let i = h.length - 1; i >= 0; i -= 1) {
			const candidate = h[i];
			if (candidate && !candidate.startsWith("/retry")) {
				submit(candidate);
				return;
			}
		}
		emit("error", "nothing to retry");
	},
};

const ui: Command = {
	name: "/ui",
	description: "open the visual portfolio",
	handler: ({ navigate }) => {
		emit("system", "opening /ui…");
		navigate({ to: "/" });
	},
};

const theme: Command = {
	name: "/theme",
	description: "list themes (no args) or set one: /theme <slug>",
	handler: ({ args }) => {
		if (args.length === 0) {
			const rows: Array<[string, string]> = themes.map((t) => [t.slug, t.vibe]);
			emit("output", `themes (use /theme <slug>):\n${formatTwoCol(rows)}`);
			return;
		}
		const slug = args[0];
		if (!slug || !isThemeSlug(slug)) {
			emit(
				"error",
				`unknown theme: ${slug ?? "(empty)"}. try /theme for the list.`,
			);
			return;
		}
		setTheme(slug as ThemeSlug);
		const name = themes.find((t) => t.slug === slug)?.name ?? slug;
		emit("output", `theme set to ${name}`);
	},
};

const github: Command = {
	name: "/github",
	description: "open my github profile",
	handler: () => {
		emit("system", "opening github…");
		openExternal(siteMeta.links.github);
	},
};

const resume: Command = {
	name: "/resume",
	description: "open my resume (pdf)",
	handler: () => {
		emit("system", "opening resume…");
		openExternal(siteMeta.links.resume);
	},
};

export const commands: Command[] = [
	help,
	clear,
	history,
	retry,
	ui,
	theme,
	github,
	resume,
];

// ─── Lookup helpers ─────────────────────────────────────────────────────

export function parseInput(
	raw: string,
): { name: string; args: string[] } | null {
	const trimmed = raw.trim();
	if (!trimmed.startsWith("/")) return null;
	const parts = trimmed.split(/\s+/);
	const name = parts[0] ?? "";
	return { name, args: parts.slice(1) };
}

export function findCommand(name: string): Command | undefined {
	return commands.find((c) => c.name === name);
}

export function autocomplete(prefix: string): string[] {
	if (!prefix.startsWith("/")) return [];
	return commands
		.filter((c) => !c.hidden && c.name.startsWith(prefix))
		.map((c) => c.name);
}

/**
 * Run a raw input line. Returns true if the line was recognized as a known
 * slash-command (even if its handler errored), false otherwise. Free-text
 * (non-slash) lines return false — they'll be routed to the agent in Phase 6.
 */
export async function runCommand(
	raw: string,
	deps: { navigate: Navigate; submit: (line: string) => void },
): Promise<boolean> {
	const parsed = parseInput(raw);
	if (!parsed) return false;
	const cmd = findCommand(parsed.name);
	if (!cmd) {
		appendBlock(
			makeBlock("error", {
				text: `unknown command: ${parsed.name}. try /help.`,
			}),
		);
		return true;
	}
	await cmd.handler({
		args: parsed.args,
		raw,
		navigate: deps.navigate,
		submit: deps.submit,
	});
	return true;
}
