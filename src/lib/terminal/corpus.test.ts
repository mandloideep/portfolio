import { describe, expect, it } from "vitest";
import { projects } from "#/content/site";
import {
	corpusRecord,
	getAllCorpusText,
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

describe("getAllCorpusText", () => {
	const text = getAllCorpusText();

	it("returns a non-empty string", () => {
		expect(typeof text).toBe("string");
		expect(text.length).toBeGreaterThan(0);
	});

	it("includes content from me.md", () => {
		expect(text).toContain(getCorpusEntry("me"));
	});

	it("includes content from experience.md", () => {
		expect(text).toContain(getCorpusEntry("experience"));
	});

	it("includes every project markdown", () => {
		for (const slug of listProjectSlugs()) {
			const md = getProjectMarkdown(slug);
			expect(md).toBeDefined();
			if (md) expect(text).toContain(md);
		}
	});

	it("excludes system-prompt.md", () => {
		const systemPrompt = corpusRecord["/src/content/agent/system-prompt.md"];
		expect(systemPrompt).toBeTypeOf("string");
		if (systemPrompt) expect(text).not.toContain(systemPrompt);
	});

	it("prefixes each entry with a relative path heading", () => {
		expect(text).toContain("# me.md");
		expect(text).toContain("# experience.md");
		expect(text).toContain("# projects/");
	});

	it("is idempotent across calls", () => {
		expect(getAllCorpusText()).toBe(text);
	});
});
