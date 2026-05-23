import { describe, expect, it } from "vitest";

/**
 * Regression test for AI-tell patterns in the agent markdown corpus.
 *
 * The system-prompt.md is exempt because it's a reference template lifted
 * from the design doc; its em-dashes are intentional in headings.
 *
 * Em-dash count is capped (not zero) — em-dashes are fine in moderation;
 * what we want to avoid is em-dash-as-aside in unbroken prose.
 */

const corpus = import.meta.glob("./agent/**/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const SYSTEM_PROMPT_PATH = "./agent/system-prompt.md";

const BANNED_WORDS = [
	/\bdelve[sd]?\b/i,
	/\bunderscore[sd]?\b/i,
	/\bleverage[sd]?\b/i, // verb form
	/\btestament\b/i,
	/\btapestry\b/i,
	/\bnavigate the\b/i,
	/\bpivotal\b/i,
	/\bvibrant\b/i,
	/\bgroundbreaking\b/i,
	/\bnestled\b/i,
	/\bin the heart of\b/i,
	/\bin today's (rapidly )?evolving\b/i,
];

describe("agent corpus style", () => {
	for (const [path, content] of Object.entries(corpus)) {
		if (path === SYSTEM_PROMPT_PATH) continue;

		describe(path, () => {
			for (const pattern of BANNED_WORDS) {
				it(`does not match ${pattern}`, () => {
					expect(content).not.toMatch(pattern);
				});
			}

			it("uses em-dashes sparingly (max 3 per file)", () => {
				const count = (content.match(/—/g) ?? []).length;
				expect(count, `${path} has ${count} em-dashes`).toBeLessThanOrEqual(3);
			});
		});
	}
});
