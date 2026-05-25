import { describe, expect, it } from "vitest";
import { siteMeta } from "#/content/site";
import {
	buildOpenGraphMeta,
	buildPersonJsonLd,
	buildRobotsTxt,
	buildSitemapXml,
} from "./seo";

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

describe("buildOpenGraphMeta", () => {
	const meta = buildOpenGraphMeta({
		title: "Test title",
		description: "Test desc",
		path: "/terminal",
		siteMeta,
	});

	function find(key: "property" | "name", value: string) {
		return meta.find((r) => r[key] === value);
	}

	it("emits og:title / og:description / og:type=website", () => {
		expect(find("property", "og:title")?.content).toBe("Test title");
		expect(find("property", "og:description")?.content).toBe("Test desc");
		expect(find("property", "og:type")?.content).toBe("website");
	});

	it("joins origin + path into absolute og:url", () => {
		expect(find("property", "og:url")?.content).toBe(
			`${siteMeta.url}/terminal`,
		);
	});

	it("emits absolute og:image using siteMeta.ogImage", () => {
		expect(find("property", "og:image")?.content).toBe(
			`${siteMeta.url}${siteMeta.ogImage}`,
		);
	});

	it("emits og:image:alt derived from name + role", () => {
		expect(find("property", "og:image:alt")?.content).toContain(siteMeta.name);
	});

	it("emits twitter card + matching title/desc/image", () => {
		expect(find("name", "twitter:card")?.content).toBe("summary_large_image");
		expect(find("name", "twitter:title")?.content).toBe("Test title");
		expect(find("name", "twitter:description")?.content).toBe("Test desc");
		expect(find("name", "twitter:image")?.content).toBe(
			`${siteMeta.url}${siteMeta.ogImage}`,
		);
	});

	it("honors ogType override", () => {
		const m = buildOpenGraphMeta({
			title: "t",
			description: "d",
			path: "/",
			siteMeta,
			ogType: "article",
		});
		expect(m.find((r) => r.property === "og:type")?.content).toBe("article");
	});

	it("path '/' produces og:url with single trailing slash", () => {
		const m = buildOpenGraphMeta({
			title: "t",
			description: "d",
			path: "/",
			siteMeta,
		});
		const url = m.find((r) => r.property === "og:url")?.content;
		expect(url).toBe(`${siteMeta.url}/`);
		// Only the protocol "//" should be present
		expect(url?.replace("://", "")).not.toContain("//");
	});

	it("strips trailing slash from origin before joining", () => {
		const m = buildOpenGraphMeta({
			title: "t",
			description: "d",
			path: "/foo",
			siteMeta: { ...siteMeta, url: "https://example.com/" },
		});
		expect(m.find((r) => r.property === "og:url")?.content).toBe(
			"https://example.com/foo",
		);
	});
});
