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
