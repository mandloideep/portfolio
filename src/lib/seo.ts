import type { SiteMeta } from "#/content/site";

/**
 * JSON-LD `Person` schema generator. Pure; tested in seo.test.ts.
 *
 * @param meta - the site meta block
 * @param origin - absolute origin (e.g. "https://deepmandloi.com"); used for
 *   `url`. Falls back to siteMeta.links.github if origin not supplied.
 */
export function buildPersonJsonLd(
	meta: SiteMeta,
	origin?: string,
): Record<string, unknown> {
	const sameAs = [meta.links.github, meta.links.linkedin].filter(Boolean);
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		name: meta.name,
		jobTitle: meta.role,
		email: `mailto:${meta.email}`,
		address: {
			"@type": "PostalAddress",
			addressLocality: meta.location,
		},
		url: origin ?? meta.links.github,
		sameAs,
	};
}

/**
 * Sitemap XML builder. Pure; tested in sitemap.test.ts.
 *
 * @param routes - list of route paths starting with "/"
 * @param origin - absolute origin to prefix
 */
export function buildSitemapXml(
	routes: readonly string[],
	origin: string,
): string {
	const urls = routes
		.map((path) => {
			const loc = `${origin.replace(/\/$/, "")}${path}`;
			return `  <url><loc>${loc}</loc></url>`;
		})
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Robots.txt body. Pure; tested in sitemap.test.ts.
 */
export function buildRobotsTxt(origin: string): string {
	return `User-agent: *\nAllow: /\nSitemap: ${origin.replace(/\/$/, "")}/sitemap.xml\n`;
}

/**
 * Input shape for {@link buildOpenGraphMeta}. `siteMeta` provides origin and
 * og-image; `path` is the route path beginning with `/`.
 */
export interface RouteHeadInput {
	title: string;
	description: string;
	path: string;
	siteMeta: {
		name: string;
		role: string;
		url: string;
		ogImage: string;
	};
	ogType?: "website" | "article";
}

function joinUrl(origin: string, path: string): string {
	const o = origin.replace(/\/$/, "");
	const p = path.startsWith("/") ? path : `/${path}`;
	return `${o}${p}`;
}

/**
 * Builds the Open Graph + Twitter meta records consumed by TanStack
 * Router's `head().meta` option. Centralized so each route only specifies
 * title + description + path.
 */
export function buildOpenGraphMeta(
	input: RouteHeadInput,
): Array<Record<string, string>> {
	const {
		title,
		description,
		path,
		siteMeta: meta,
		ogType = "website",
	} = input;
	const ogUrl = joinUrl(meta.url, path);
	const ogImage = joinUrl(meta.url, meta.ogImage);
	return [
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:type", content: ogType },
		{ property: "og:url", content: ogUrl },
		{ property: "og:image", content: ogImage },
		{ property: "og:image:alt", content: `${meta.name} — ${meta.role}` },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: ogImage },
	];
}
