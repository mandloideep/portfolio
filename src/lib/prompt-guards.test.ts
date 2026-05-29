import { describe, expect, it } from "vitest";
import {
	hasDisallowedContent,
	isBrowserUserAgent,
	wordCount,
} from "./prompt-guards";

describe("wordCount", () => {
	it("returns 0 for empty + whitespace-only input", () => {
		expect(wordCount("")).toBe(0);
		expect(wordCount("   ")).toBe(0);
		expect(wordCount("\n\t\n")).toBe(0);
	});

	it("splits on any whitespace", () => {
		expect(wordCount("hello world")).toBe(2);
		expect(wordCount("hello   world")).toBe(2);
		expect(wordCount("hello\nworld\nfoo")).toBe(3);
	});

	it("collapses leading/trailing whitespace before counting", () => {
		expect(wordCount("   hello world   ")).toBe(2);
	});
});

describe("hasDisallowedContent", () => {
	it("flags SSN-shaped strings", () => {
		expect(hasDisallowedContent("my ssn is 123-45-6789, please advise")).toBe(
			"ssn",
		);
	});

	it("flags credit-card-shaped runs", () => {
		expect(hasDisallowedContent("4111 1111 1111 1111")).toBe("credit_card");
	});

	it("returns null for safe input", () => {
		expect(hasDisallowedContent("what projects has deep worked on")).toBeNull();
		expect(hasDisallowedContent("tell me about your skills")).toBeNull();
	});
});

describe("isBrowserUserAgent", () => {
	it("accepts common browser UAs", () => {
		expect(
			isBrowserUserAgent(
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			),
		).toBe(true);
		expect(
			isBrowserUserAgent(
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
			),
		).toBe(true);
	});

	it("rejects empty / scripted UAs", () => {
		expect(isBrowserUserAgent("")).toBe(false);
		expect(isBrowserUserAgent("curl/8.4.0")).toBe(false);
		expect(isBrowserUserAgent("python-requests/2.32.0")).toBe(false);
		expect(isBrowserUserAgent("node-fetch/3.3.2")).toBe(false);
		expect(isBrowserUserAgent("PostmanRuntime/7.36.0")).toBe(false);
	});
});
