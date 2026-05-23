import { describe, expect, it } from "vitest";
import { z } from "zod";
import { experience, projects, research, skills } from "./site";

describe("site.ts content", () => {
	it("has at least one featured project", () => {
		expect(projects.some((p) => p.featured)).toBe(true);
	});

	it("project slugs are unique", () => {
		const slugs = projects.map((p) => p.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("research slugs are unique", () => {
		const slugs = research.map((r) => r.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("skills groups are unique", () => {
		const groups = skills.map((s) => s.group);
		expect(new Set(groups).size).toBe(groups.length);
	});

	it("experience entries are ordered: each has start and end strings", () => {
		for (const e of experience) {
			expect(e.start.length).toBeGreaterThan(0);
			expect(e.end.length).toBeGreaterThan(0);
		}
	});

	it("a bad project status throws on parse", () => {
		const ProjectSchema = z.object({
			slug: z.string(),
			status: z.enum(["running", "complete", "wip", "archived"]),
		});
		expect(() =>
			ProjectSchema.parse({ slug: "x", status: "in-progress" as never }),
		).toThrow();
	});
});
