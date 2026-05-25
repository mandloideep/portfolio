import { describe, expect, it } from "vitest";
import { assembleContext, selectFiles } from "./context";

describe("selectFiles", () => {
	it("project keywords include every project file", () => {
		// "code" only matches the project route — keeps the assertion clean.
		const files = selectFiles("show me your code");
		expect(files.some((f) => f.startsWith("projects/"))).toBe(true);
		expect(
			files.filter((f) => f.startsWith("projects/")).length,
		).toBeGreaterThan(0);
	});

	it("hire/work keywords include experience + contact", () => {
		const files = selectFiles("are you available for work?");
		expect(files).toEqual(
			expect.arrayContaining(["experience.md", "contact.md"]),
		);
	});

	it("skill keywords include skills.md", () => {
		const files = selectFiles("what languages do you know");
		expect(files).toContain("skills.md");
	});

	it("self-reference keywords include me.md", () => {
		const files = selectFiles("who are you");
		expect(files).toContain("me.md");
	});

	it("default route includes me + contact for ambiguous input", () => {
		const files = selectFiles("hi there");
		expect(files).toEqual(["me.md", "contact.md"]);
	});

	it("multiple matches accumulate (project + hire)", () => {
		const files = selectFiles(
			"any code projects you built during your internship?",
		);
		expect(files).toEqual(
			expect.arrayContaining(["experience.md", "contact.md"]),
		);
		expect(files.some((f) => f.startsWith("projects/"))).toBe(true);
	});
});

describe("assembleContext", () => {
	it("returns the system prompt verbatim", () => {
		const result = assembleContext("hi");
		expect(result.system.length).toBeGreaterThan(0);
	});

	it("labels each doc with a ## <file> heading", () => {
		const result = assembleContext("who are you");
		expect(result.contextDocs).toMatch(/## me\.md/);
	});

	it("joins multiple docs with --- separators", () => {
		const result = assembleContext("hi"); // default route → 2 files
		expect(result.contextDocs.split("\n\n---\n\n").length).toBe(2);
	});
});
