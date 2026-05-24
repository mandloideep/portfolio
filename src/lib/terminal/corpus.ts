/**
 * Loads the agent markdown corpus at module-load time via Vite's
 * `import.meta.glob`. Used by terminal content commands (/me, /experience,
 * /skills, /contact, /projects) and the Phase-5 shell VFS will reuse
 * `corpusRecord` directly to avoid a second glob.
 *
 * Throws synchronously if any of the four required top-level files are
 * missing, so a rename surfaces at the first import rather than mid-session.
 */

const rawRecord = import.meta.glob("/src/content/agent/**/*.md", {
	eager: true,
	query: "?raw",
	import: "default",
}) as Record<string, string>;

export const corpusRecord: Readonly<Record<string, string>> = rawRecord;

export type TopLevelKey = "me" | "experience" | "skills" | "contact";

const TOP_LEVEL_KEYS: readonly TopLevelKey[] = [
	"me",
	"experience",
	"skills",
	"contact",
] as const;

function topLevelPath(key: TopLevelKey): string {
	return `/src/content/agent/${key}.md`;
}

function projectPath(slug: string): string {
	return `/src/content/agent/projects/${slug}.md`;
}

const missingTopLevel = TOP_LEVEL_KEYS.filter(
	(k) => typeof corpusRecord[topLevelPath(k)] !== "string",
);
if (missingTopLevel.length > 0) {
	throw new Error(
		`agent corpus is missing required files: ${missingTopLevel
			.map(topLevelPath)
			.join(", ")}`,
	);
}

export function getCorpusEntry(key: TopLevelKey): string {
	const text = corpusRecord[topLevelPath(key)];
	if (typeof text !== "string") {
		throw new Error(`corpus entry not loaded: ${key}`);
	}
	return text;
}

export function getProjectMarkdown(slug: string): string | undefined {
	const text = corpusRecord[projectPath(slug)];
	return typeof text === "string" ? text : undefined;
}

export function listProjectSlugs(): string[] {
	const prefix = "/src/content/agent/projects/";
	return Object.keys(corpusRecord)
		.filter((p) => p.startsWith(prefix) && p.endsWith(".md"))
		.map((p) => p.slice(prefix.length, -".md".length))
		.sort();
}
