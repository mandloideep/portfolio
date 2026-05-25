import { projects, siteMeta } from "#/content/site";
import { isThemeSlug, type ThemeSlug, themes } from "#/content/themes";
import { OPENROUTER_MODELS } from "#/lib/openrouter";
import { makeBlock } from "#/lib/terminal/blocks";
import {
	getCorpusEntry,
	getProjectMarkdown,
	listProjectSlugs,
} from "#/lib/terminal/corpus";
import { formatTwoCol } from "#/lib/terminal/format";
import { modelStore, setModel } from "#/store/model";
import {
	appendBlock,
	clearBlocks,
	emit,
	setMode,
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

const me: Command = {
	name: "/me",
	description: "about deep",
	handler: () => {
		emit("markdown", getCorpusEntry("me"));
	},
};

const experience: Command = {
	name: "/experience",
	description: "work + research history",
	handler: () => {
		emit("markdown", getCorpusEntry("experience"));
	},
};

const skills: Command = {
	name: "/skills",
	description: "languages, infra, ai, fun",
	handler: () => {
		emit("markdown", getCorpusEntry("skills"));
	},
};

const contact: Command = {
	name: "/contact",
	description: "how to reach me",
	handler: () => {
		emit("markdown", getCorpusEntry("contact"));
	},
};

const exit: Command = {
	name: "/exit",
	description: "drop into shell mode (type 'deep' to come back)",
	handler: () => {
		setMode("shell");
		emit(
			"system",
			"dropped into shell. type `help` for commands, `deep` to return.",
		);
	},
};

const model: Command = {
	name: "/model",
	description: "show or switch the agent model: /model [list|<id>]",
	handler: ({ args }) => {
		const sub = args[0];
		if (!sub) {
			const current = modelStore.state.activeModel;
			const label =
				OPENROUTER_MODELS.find((m) => m.id === current)?.label ?? current;
			emit("output", `model: ${current} (${label})`);
			return;
		}
		if (sub === "list") {
			const rows: Array<[string, string]> = OPENROUTER_MODELS.map((m) => [
				m.id,
				m.label,
			]);
			emit("output", `models (use /model <id>):\n${formatTwoCol(rows)}`);
			return;
		}
		if (!setModel(sub)) {
			const known = OPENROUTER_MODELS.map((m) => m.id).join(", ");
			emit("error", `unknown model: ${sub}. known: ${known}.`);
			return;
		}
		emit("output", `model set to ${sub}`);
	},
};

const projectsCmd: Command = {
	name: "/projects",
	description: "list projects (no args) or open one: /projects <slug>",
	handler: ({ args }) => {
		if (args.length === 0) {
			const rows: Array<[string, string]> = projects.map((p) => [
				p.slug,
				p.title,
			]);
			emit("output", `projects (use /projects <slug>):\n${formatTwoCol(rows)}`);
			return;
		}
		const slug = args[0] ?? "";
		const text = getProjectMarkdown(slug);
		if (!text) {
			const known = listProjectSlugs().join(", ");
			emit(
				"error",
				`unknown project: ${slug}. known: ${known}. try /projects.`,
			);
			return;
		}
		emit("markdown", text);
	},
};

export const commands: Command[] = [
	help,
	clear,
	history,
	retry,
	me,
	experience,
	skills,
	projectsCmd,
	contact,
	ui,
	theme,
	model,
	github,
	resume,
	exit,
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
