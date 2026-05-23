import { describe, expect, it } from "vitest";
import { siteMeta } from "#/content/site";
import { buildPersonJsonLd, buildRobotsTxt, buildSitemapXml } from "./seo";

describe("buildPersonJsonLd", () => {
	const ld = buildPersonJsonLd(siteMeta, "https://deepmandloi.com");

	it("declares schema.org Person", () => {
		expect(ld["@context"]).toBe("https://schema.org");
		expect(ld["@type"]).toBe("Person");
	});

	it("uses the meta fields", () => {
		expect(ld.name).toBe(siteMeta.name);
		expect(ld.jobTitle).toBe(siteMeta.role);
		expect(ld.email).toBe(`mailto:${siteMeta.email}`);
		expect(ld.url).toBe("https://deepmandloi.com");
	});

	it("populates sameAs with social links", () => {
		expect(ld.sameAs).toEqual(
			expect.arrayContaining([siteMeta.links.github, siteMeta.links.linkedin]),
		);
	});

	it("falls back to github when origin is omitted", () => {
		const fallback = buildPersonJsonLd(siteMeta);
		expect(fallback.url).toBe(siteMeta.links.github);
	});

	it("serializes to valid JSON", () => {
		expect(() => JSON.parse(JSON.stringify(ld))).not.toThrow();
	});
});

describe("buildSitemapXml", () => {
	const xml = buildSitemapXml(["/", "/terminal"], "https://deepmandloi.com/");

	it("emits an XML preamble and urlset envelope", () => {
		expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
		expect(xml).toContain(
			`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		);
		expect(xml).toContain("</urlset>");
	});

	it("includes each route", () => {
		expect(xml).toContain("<loc>https://deepmandloi.com/</loc>");
		expect(xml).toContain("<loc>https://deepmandloi.com/terminal</loc>");
	});

	it("strips trailing slash from origin", () => {
		const xml2 = buildSitemapXml(["/foo"], "https://example.com/");
		expect(xml2).toContain("<loc>https://example.com/foo</loc>");
		expect(xml2).not.toContain("//foo");
	});
});

describe("buildRobotsTxt", () => {
	it("emits a permissive robots with sitemap pointer", () => {
		const r = buildRobotsTxt("https://deepmandloi.com");
		expect(r).toContain("User-agent: *");
		expect(r).toContain("Allow: /");
		expect(r).toContain("Sitemap: https://deepmandloi.com/sitemap.xml");
	});
});
