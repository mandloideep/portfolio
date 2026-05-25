import { describe, expect, it } from "vitest";
import { siteMeta } from "#/content/site";
import { Route, TERMINAL_DESCRIPTION, TERMINAL_TITLE } from "./terminal";

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

describe("/terminal route head()", () => {
	const meta = getMeta();

	it("uses the terminal-specific title", () => {
		const titleEntry = meta.find((m) => typeof m.title === "string");
		expect(titleEntry?.title).toBe(TERMINAL_TITLE);
		expect(TERMINAL_TITLE).toContain("terminal");
	});

	it("og:url targets /terminal", () => {
		const ogUrl = meta.find((m) => m.property === "og:url");
		expect(ogUrl?.content).toBe(`${siteMeta.url}/terminal`);
	});

	it("emits terminal-specific description", () => {
		const desc = meta.find((m) => m.name === "description");
		expect(desc?.content).toBe(TERMINAL_DESCRIPTION);
	});

	it("twitter:title mirrors the page title", () => {
		const tw = meta.find((m) => m.name === "twitter:title");
		expect(tw?.content).toBe(TERMINAL_TITLE);
	});
});
