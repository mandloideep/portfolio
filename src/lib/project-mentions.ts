/**
 * Project-mention detection for agent answers.
 *
 * Belt-and-suspenders to the streamdown `<a>` override: even if the model
 * doesn't emit a real markdown link, this helper scans the answer text for
 * any project's slug, title, or live/repo host and returns the set of slugs
 * that should get a "view project" chip under the bubble.
 *
 * Precision over recall: we only match on:
 *   1. exact host appearances (e.g. "mydininghall.com") via case-insensitive search
 *   2. project `title` as a whole-token substring
 *   3. project `slug` as a whole-token substring
 *
 * Substrings inside larger words don't match — keeps false positives low.
 */

import { projects } from "#/content/site";

type HostIndex = ReadonlyArray<{ host: string; slug: string }>;

function normalizeHost(url: string): string | null {
	try {
		return new URL(url).host.replace(/^www\./, "").toLowerCase();
	} catch {
		return null;
	}
}

const HOST_INDEX: HostIndex = projects.flatMap((p) => {
	const hosts: { host: string; slug: string }[] = [];
	for (const url of [p.links.live, p.links.repo]) {
		if (!url) continue;
		const host = normalizeHost(url);
		if (host) hosts.push({ host, slug: p.slug });
	}
	return hosts;
});

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenMatches(haystack: string, needle: string): boolean {
	const re = new RegExp(
		`(?<![A-Za-z0-9-])${escapeRegex(needle)}(?![A-Za-z0-9-])`,
		"i",
	);
	return re.test(haystack);
}

/** Hostname-shaped titles (e.g. "deepmandloi.com") are substrings of every
 *  other project's live URL, so matching them as titles produces false
 *  positives. Treat such titles as already covered by the host index. */
function isHostnameShaped(s: string): boolean {
	return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s.trim());
}

export function detectProjectMentions(text: string): ReadonlyArray<string> {
	if (!text) return [];
	const hits = new Set<string>();
	for (const { host, slug } of HOST_INDEX) {
		if (tokenMatches(text, host)) hits.add(slug);
	}
	for (const p of projects) {
		if (tokenMatches(text, p.slug)) hits.add(p.slug);
		if (!isHostnameShaped(p.title) && tokenMatches(text, p.title)) {
			hits.add(p.slug);
		}
	}
	return Array.from(hits);
}
