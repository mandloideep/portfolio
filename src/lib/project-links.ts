/**
 * Project link interception + per-project markdown lookup for the chat surface.
 *
 * - `resolveProjectFromHref(href)` returns a project slug when the link points
 *   to a known project's `live` or `repo` URL — so the agent's prose `[…](
 *   https://mydininghall.com)` link can be re-rendered as a button that opens
 *   the in-chat project popup instead of navigating out.
 * - `getProjectMarkdownSync(slug)` loads the project's agent-prose markdown
 *   (the same files the LLM is grounded on) so the popup can render rich
 *   content without an extra fetch.
 */

import { type Project, projects } from "#/content/site";

function normalize(href: string): string | null {
	try {
		const u = new URL(href);
		const host = u.host.replace(/^www\./, "").toLowerCase();
		const path = u.pathname.replace(/\/+$/, "");
		return `${host}${path}`;
	} catch {
		return null;
	}
}

const URL_TO_SLUG = new Map<string, string>();
for (const p of projects) {
	const candidates = [p.links.live, p.links.repo].filter(
		(v): v is string => typeof v === "string",
	);
	for (const url of candidates) {
		const key = normalize(url);
		if (key) URL_TO_SLUG.set(key, p.slug);
	}
}

export function resolveProjectFromHref(href: string): string | null {
	const key = normalize(href);
	return key ? (URL_TO_SLUG.get(key) ?? null) : null;
}

const MARKDOWN_GLOB = import.meta.glob("/src/content/agent/projects/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

export function getProjectMarkdownSync(slug: string): string | null {
	return MARKDOWN_GLOB[`/src/content/agent/projects/${slug}.md`] ?? null;
}

export function getProjectBySlug(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}
