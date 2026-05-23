import { beforeEach, describe, expect, it } from "vitest";
import { _resetEnvCacheForTests, getServerEnv } from "./env";

beforeEach(() => {
	_resetEnvCacheForTests();
});

const complete = {
	OPENROUTER_API_KEY: "sk-or-xxx",
	OPENROUTER_DEFAULT_MODEL: "anthropic/claude-sonnet-4-6",
	GITHUB_TOKEN: "ghp_xxx",
	GITHUB_USERNAME: "deepmandloi",
} satisfies NodeJS.ProcessEnv;

describe("getServerEnv", () => {
	it("parses a complete env", () => {
		const env = getServerEnv(complete);
		expect(env.OPENROUTER_API_KEY).toBe("sk-or-xxx");
		expect(env.GITHUB_USERNAME).toBe("deepmandloi");
	});

	it("applies the default model when not set", () => {
		const env = getServerEnv({
			OPENROUTER_API_KEY: "k",
			GITHUB_TOKEN: "t",
			GITHUB_USERNAME: "u",
		});
		expect(env.OPENROUTER_DEFAULT_MODEL).toBe("google/gemini-2.5-flash-lite");
	});

	it("makes IPINFO_TOKEN optional", () => {
		const env = getServerEnv(complete);
		expect(env.IPINFO_TOKEN).toBeUndefined();
	});

	it("throws with a message that names missing keys", () => {
		expect(() =>
			getServerEnv({
				OPENROUTER_DEFAULT_MODEL: "x",
			}),
		).toThrow(/OPENROUTER_API_KEY/);
	});

	it("throws naming all missing required keys", () => {
		try {
			getServerEnv({});
			expect.fail("should have thrown");
		} catch (err) {
			const msg = (err as Error).message;
			expect(msg).toMatch(/OPENROUTER_API_KEY/);
			expect(msg).toMatch(/GITHUB_TOKEN/);
			expect(msg).toMatch(/GITHUB_USERNAME/);
		}
	});
});
