import { describe, expect, it } from "vitest";
import { projects } from "#/content/site";
import {
	corpusRecord,
	getCorpusEntry,
	getProjectMarkdown,
	listProjectSlugs,
} from "./corpus";

describe("agent corpus loader", () => {
	it("loads all four top-level entries", () => {
		expect(getCorpusEntry("me").startsWith("# ")).toBe(true);
		expect(getCorpusEntry("experience").startsWith("# ")).toBe(true);
		expect(getCorpusEntry("skills").startsWith("# ")).toBe(true);
		expect(getCorpusEntry("contact").startsWith("# ")).toBe(true);
	});

	it("lists project slugs sorted", () => {
		const slugs = listProjectSlugs();
		expect(slugs.length).toBeGreaterThan(0);
		expect([...slugs].sort()).toEqual(slugs);
	});

	it("project slugs match site.ts (bijection)", () => {
		const fromCorpus = new Set(listProjectSlugs());
		const fromSite = new Set(projects.map((p) => p.slug));
		expect(fromCorpus).toEqual(fromSite);
	});

	it("getProjectMarkdown returns text for known slug", () => {
		const text = getProjectMarkdown("mydininghall");
		expect(typeof text).toBe("string");
		expect(text?.startsWith("# ")).toBe(true);
	});

	it("getProjectMarkdown returns undefined for unknown slug", () => {
		expect(getProjectMarkdown("does-not-exist")).toBeUndefined();
	});

	it("corpusRecord exposes path → text map", () => {
		expect(corpusRecord["/src/content/agent/me.md"]).toBeTypeOf("string");
	});
});
