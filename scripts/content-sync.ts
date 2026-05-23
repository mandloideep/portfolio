/**
 * Pure helper for content sync. Kept separate from the script entrypoint so
 * it can be unit-tested without touching the filesystem or process.exit.
 */

export type SyncReport = {
	ok: boolean;
	missing: string[]; // slug present in projects[], no markdown file
	extra: string[]; // markdown file present, no project entry
};

export function checkProjectSync(
	projectSlugs: readonly string[],
	markdownFilenames: readonly string[],
): SyncReport {
	const slugsFromFiles = markdownFilenames
		.filter((f) => f.endsWith(".md"))
		.map((f) => f.replace(/\.md$/, ""));

	const slugSet = new Set(projectSlugs);
	const fileSet = new Set(slugsFromFiles);

	const missing = projectSlugs.filter((s) => !fileSet.has(s));
	const extra = slugsFromFiles.filter((s) => !slugSet.has(s));

	return {
		ok: missing.length === 0 && extra.length === 0,
		missing,
		extra,
	};
}
