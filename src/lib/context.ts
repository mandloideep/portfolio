/**
 * Keyword-routed context assembly for the agent.
 *
 * Pure: no IO, no env access. Reads the already-loaded `corpusRecord` from
 * `src/lib/terminal/corpus.ts`. The server route composes the final system
 * message as `system + "\n\n# Context\n\n" + contextDocs`.
 *
 * Routing rules per `04-agents-and-commands.md` lines 106–116.
 */

import { corpusRecord } from "#/lib/terminal/corpus";

const SYSTEM_PROMPT_PATH = "/src/content/agent/system-prompt.md";
const PROJECT_PREFIX = "/src/content/agent/projects/";

const ROUTES: Array<{ pattern: RegExp; files: string[] }> = [
	{
		pattern:
			/\b(project|projects|build|built|building|code|coding|repo|repos)\b/i,
		// All project files: resolved lazily from corpusRecord.
		files: [],
	},
	{
		pattern: /\b(intern|internship|role|roles|work|hire|hiring|job|career)\b/i,
		files: ["experience.md", "contact.md"],
	},
	{
		pattern: /\b(skill|skills|language|languages|tech|stack|tooling)\b/i,
		files: ["skills.md"],
	},
	{
		pattern: /\b(deep|you|your|yourself|about)\b/i,
		files: ["me.md"],
	},
];

const DEFAULT_FILES = ["me.md", "contact.md"];

export type ContextResult = {
	/** Raw text of `system-prompt.md`. */
	system: string;
	/** Concatenated contextual docs, each prefixed with `## <file>` heading. */
	contextDocs: string;
	/** Resolved file list (relative to `src/content/agent/`). */
	files: string[];
};

export function getSystemPrompt(): string {
	const text = corpusRecord[SYSTEM_PROMPT_PATH];
	if (typeof text !== "string") {
		throw new Error("agent corpus is missing system-prompt.md");
	}
	return text;
}

function listProjectFiles(): string[] {
	return Object.keys(corpusRecord)
		.filter((p) => p.startsWith(PROJECT_PREFIX) && p.endsWith(".md"))
		.sort()
		.map((p) => `projects/${p.slice(PROJECT_PREFIX.length)}`);
}

function resolveFile(relative: string): string | null {
	const text = corpusRecord[`/src/content/agent/${relative}`];
	return typeof text === "string" ? text : null;
}

/**
 * Pick which corpus files to include for `message`.
 * Returns the list of relative paths (e.g. `me.md`, `projects/foo.md`).
 * Exported for testing.
 */
export function selectFiles(message: string): string[] {
	const selected = new Set<string>();
	for (const route of ROUTES) {
		if (!route.pattern.test(message)) continue;
		if (route.files.length === 0) {
			// Project route → include every project file.
			for (const f of listProjectFiles()) selected.add(f);
		} else {
			for (const f of route.files) selected.add(f);
		}
	}
	if (selected.size === 0) {
		for (const f of DEFAULT_FILES) selected.add(f);
	}
	return [...selected];
}

export function assembleContext(message: string): ContextResult {
	const files = selectFiles(message);
	const parts: string[] = [];
	for (const file of files) {
		const text = resolveFile(file);
		if (!text) continue;
		parts.push(`## ${file}\n\n${text.trim()}`);
	}
	return {
		system: getSystemPrompt(),
		contextDocs: parts.join("\n\n---\n\n"),
		files,
	};
}
