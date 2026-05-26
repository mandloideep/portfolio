import { describe, expect, it } from "vitest";
import { detectProjectMentions } from "./project-mentions";

describe("detectProjectMentions", () => {
	it("detects a project from its live host", () => {
		expect(
			detectProjectMentions("Deep ships mydininghall.com from one stack."),
		).toEqual(["mydininghall"]);
	});

	it("detects a project from its slug", () => {
		expect(
			detectProjectMentions("his testbed lives in agent-portfolio today"),
		).toEqual(["agent-portfolio"]);
	});

	it("dedupes when the same project is mentioned by host and slug", () => {
		const hits = detectProjectMentions(
			"see mydininghall.com — slug mydininghall.",
		);
		expect(hits).toEqual(["mydininghall"]);
	});

	it("does not match substrings inside other words", () => {
		expect(detectProjectMentions("the mydininghallcomplicated thing")).toEqual(
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
