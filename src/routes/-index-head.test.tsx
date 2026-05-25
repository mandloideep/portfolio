import { describe, expect, it } from "vitest";
import { siteMeta } from "#/content/site";
import { INDEX_TITLE, Route } from "./index";

interface MetaEntry {
	title?: string;
	name?: string;
	property?: string;
	content?: string;
}

function getMeta(): MetaEntry[] {
	const out = Route.options.head?.({} as never);
	return ((out as { meta?: MetaEntry[] } | undefined)?.meta ??
		[]) as MetaEntry[];
}

describe("/ route head()", () => {
	const meta = getMeta();

	it("uses the portfolio-specific title", () => {
		const titleEntry = meta.find((m) => typeof m.title === "string");
		expect(titleEntry?.title).toBe(INDEX_TITLE);
		expect(INDEX_TITLE).toContain("portfolio");
	});

	it("og:url ends with /", () => {
		const ogUrl = meta.find((m) => m.property === "og:url");
		expect(ogUrl?.content).toBe(`${siteMeta.url}/`);
	});

	it("og:image is absolute", () => {
		const ogImage = meta.find((m) => m.property === "og:image");
		expect(ogImage?.content).toBe(`${siteMeta.url}${siteMeta.ogImage}`);
	});
});
