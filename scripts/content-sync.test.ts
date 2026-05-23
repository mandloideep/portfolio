import { describe, expect, it } from "vitest";
import { checkProjectSync } from "./content-sync";

describe("checkProjectSync", () => {
	it("returns ok when sets match", () => {
		const r = checkProjectSync(["a", "b"], ["a.md", "b.md"]);
		expect(r.ok).toBe(true);
		expect(r.missing).toEqual([]);
		expect(r.extra).toEqual([]);
	});

	it("reports missing markdown for a slug", () => {
		const r = checkProjectSync(["a", "b"], ["a.md"]);
		expect(r.ok).toBe(false);
		expect(r.missing).toEqual(["b"]);
		expect(r.extra).toEqual([]);
	});

	it("reports extra markdown without a project", () => {
		const r = checkProjectSync(["a"], ["a.md", "ghost.md"]);
		expect(r.ok).toBe(false);
		expect(r.missing).toEqual([]);
		expect(r.extra).toEqual(["ghost"]);
	});

	it("ignores non-markdown files in the listing", () => {
		const r = checkProjectSync(["a"], ["a.md", ".DS_Store", "README"]);
		expect(r.ok).toBe(true);
	});

	it("handles empty input", () => {
		const r = checkProjectSync([], []);
		expect(r.ok).toBe(true);
	});
});
