import { describe, expect, it } from "vitest";
import { projects } from "#/content/site";
import {
	HOME,
	listDir,
	lookupNode,
	normalizePath,
	resolvePath,
	vfsRoot,
} from "./shell-vfs";

describe("vfsRoot tree", () => {
	it("exposes the top-level corpus files under home", () => {
		expect(lookupNode(`${HOME}/me.md`)?.kind).toBe("file");
		expect(lookupNode(`${HOME}/experience.md`)?.kind).toBe("file");
		expect(lookupNode(`${HOME}/skills.md`)?.kind).toBe("file");
		expect(lookupNode(`${HOME}/contact.md`)?.kind).toBe("file");
	});

	it("nests projects and facts as directories", () => {
		const projectsDir = lookupNode(`${HOME}/projects`);
		expect(projectsDir?.kind).toBe("dir");
		const factsDir = lookupNode(`${HOME}/facts`);
		expect(factsDir?.kind).toBe("dir");
	});

	it("includes every project slug as a markdown file", () => {
		for (const project of projects) {
			const node = lookupNode(`${HOME}/projects/${project.slug}.md`);
			expect(node?.kind, `missing ${project.slug}.md`).toBe("file");
		}
	});

	it("listDir returns dirs (trailing /) before files, alpha within group", () => {
		const entries = listDir(vfsRoot);
		const slashIndex = entries.findIndex((e) => !e.endsWith("/"));
		const dirs = slashIndex === -1 ? entries : entries.slice(0, slashIndex);
		const files = slashIndex === -1 ? [] : entries.slice(slashIndex);
		expect(dirs).toEqual([...dirs].sort());
		expect(files).toEqual([...files].sort());
		expect(dirs.every((d) => d.endsWith("/"))).toBe(true);
		expect(files.every((f) => !f.endsWith("/"))).toBe(true);
	});
});

describe("normalizePath", () => {
	it("returns home for empty / ~ / /", () => {
		expect(normalizePath("")).toBe(HOME);
		expect(normalizePath("~")).toBe(HOME);
		expect(normalizePath("/")).toBe(HOME);
		expect(normalizePath("~/")).toBe(HOME);
	});

	it("collapses . and ..", () => {
		expect(normalizePath("~/projects/.")).toBe(`${HOME}/projects`);
		expect(normalizePath("~/projects/..")).toBe(HOME);
		expect(normalizePath("~/projects/../facts")).toBe(`${HOME}/facts`);
	});

	it("clamps escapes above home", () => {
		expect(normalizePath("~/../..")).toBe(HOME);
		expect(normalizePath("/../foo/..")).toBe(HOME);
	});

	it("strips empty / double-slash segments", () => {
		expect(normalizePath("~//projects///foo")).toBe(`${HOME}/projects/foo`);
	});

	it("treats absolute paths starting with / as home-relative", () => {
		expect(normalizePath("/projects")).toBe(`${HOME}/projects`);
	});
});

describe("resolvePath", () => {
	it("returns cwd for empty arg", () => {
		expect(resolvePath(`${HOME}/projects`, "")).toBe(`${HOME}/projects`);
	});

	it("treats absolute and ~ args as anchored to home", () => {
		expect(resolvePath(`${HOME}/projects`, "/facts")).toBe(`${HOME}/facts`);
		expect(resolvePath(`${HOME}/projects`, "~/facts")).toBe(`${HOME}/facts`);
		expect(resolvePath(`${HOME}/projects`, "~")).toBe(HOME);
	});

	it("joins relative args against cwd", () => {
		expect(resolvePath(HOME, "projects")).toBe(`${HOME}/projects`);
		expect(resolvePath(`${HOME}/projects`, "..")).toBe(HOME);
	});
});

describe("lookupNode", () => {
	it("returns undefined for missing paths", () => {
		expect(lookupNode(`${HOME}/does-not-exist.md`)).toBeUndefined();
		expect(lookupNode(`${HOME}/projects/no-such-slug.md`)).toBeUndefined();
	});

	it("returns the root for home", () => {
		expect(lookupNode(HOME)).toBe(vfsRoot);
	});
});
