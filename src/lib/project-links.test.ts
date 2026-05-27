import { describe, expect, it } from "vitest";
import { resolveProjectFromHref } from "./project-links";

describe("resolveProjectFromHref", () => {
	it("resolves the canonical project URL", () => {
		expect(resolveProjectFromHref("https://commentdraw.deepmandloi.com")).toBe(
			"commentdraw",
		);
	});

	it("strips trailing slash before lookup", () => {
		expect(resolveProjectFromHref("https://commentdraw.deepmandloi.com/")).toBe(
			"commentdraw",
		);
	});

	it("strips the www. prefix before lookup", () => {
		expect(
			resolveProjectFromHref("https://www.commentdraw.deepmandloi.com"),
		).toBe("commentdraw");
	});

	it("returns null for invalid URLs (bare host with no scheme)", () => {
		// new URL() rejects scheme-less strings; the helper handles that quietly.
		expect(resolveProjectFromHref("commentdraw.deepmandloi.com")).toBeNull();
	});

	it("resolves repo URLs to their owning project", () => {
		expect(
			resolveProjectFromHref("https://github.com/mandloideep/portfolio"),
		).toBe("agent-portfolio");
	});

	it("returns null for URLs that don't belong to any project", () => {
		expect(resolveProjectFromHref("https://example.com")).toBeNull();
	});
});
