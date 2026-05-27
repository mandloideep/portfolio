import { describe, expect, it } from "vitest";
import { detectProjectMentions } from "./project-mentions";

describe("detectProjectMentions", () => {
	it("detects a project from its live host", () => {
		expect(
			detectProjectMentions(
				"Deep ships commentdraw.deepmandloi.com from one stack.",
			),
		).toEqual(["commentdraw"]);
	});

	it("detects a project from its slug", () => {
		expect(
			detectProjectMentions("his testbed lives in agent-portfolio today"),
		).toEqual(["agent-portfolio"]);
	});

	it("dedupes when the same project is mentioned by host and slug", () => {
		const hits = detectProjectMentions(
			"see commentdraw.deepmandloi.com slug commentdraw.",
		);
		expect(hits).toEqual(["commentdraw"]);
	});

	it("does not match substrings inside other words", () => {
		expect(detectProjectMentions("the commentdrawcomplicated thing")).toEqual(
			[],
		);
	});

	it("returns an empty array for unrelated text", () => {
		expect(detectProjectMentions("Deep likes long-distance running.")).toEqual(
			[],
		);
	});

	it("is empty for empty input", () => {
		expect(detectProjectMentions("")).toEqual([]);
	});
});
