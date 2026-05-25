import { describe, expect, it } from "vitest";
import { siteMeta } from "#/content/site";
import { Route } from "./__root";

interface MetaEntry {
	title?: string;
	name?: string;
	property?: string;
	content?: string;
	charSet?: string;
}

function getMeta(): MetaEntry[] {
	const out = Route.options.head?.({
		matches: [],
		match: undefined as never,
		params: {},
		loaderData: undefined,
	} as never);
	return ((out as { meta?: MetaEntry[] } | undefined)?.meta ??
		[]) as MetaEntry[];
}

describe("root route head()", () => {
	const meta = getMeta();
	const find = (key: keyof MetaEntry, value: string) =>
		meta.find((m) => m[key] === value);

	it("emits og:url from siteMeta.url (not a hardcoded literal)", () => {
		const ogUrl = find("property", "og:url");
		expect(ogUrl?.content).toBe(`${siteMeta.url}/`);
	});

	it("emits og:image referencing siteMeta.ogImage", () => {
		const ogImage = find("property", "og:image");
		expect(ogImage?.content).toBe(`${siteMeta.url}${siteMeta.ogImage}`);
	});

	it("emits a description from siteMeta.description", () => {
		const desc = find("name", "description");
		expect(desc?.content).toBe(siteMeta.description);
	});

	it("uses the canonical site title", () => {
		const titleEntry = meta.find((m) => typeof m.title === "string");
		expect(titleEntry?.title).toContain(siteMeta.name);
		expect(titleEntry?.title).toContain(siteMeta.role);
	});
});
