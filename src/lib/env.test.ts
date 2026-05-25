import { beforeEach, describe, expect, it } from "vitest";
import { _resetEnvCacheForTests, getLlmConfig, getServerEnv } from "./env";

beforeEach(() => {
	_resetEnvCacheForTests();
});

const completeOpenRouter = {
	OPENROUTER_API_KEY: "sk-or-xxx",
	OPENROUTER_DEFAULT_MODEL: "google/gemini-2.5-flash-lite",
	GITHUB_TOKEN: "ghp_xxx",
	GITHUB_USERNAME: "deepmandloi",
} satisfies NodeJS.ProcessEnv;

const completeGemini = {
	LLM_PROVIDER: "gemini",
	GEMINI_API_KEY: "AIza-xxx",
	GEMINI_DEFAULT_MODEL: "gemini-2.5-flash-lite",
	GITHUB_TOKEN: "ghp_xxx",
	GITHUB_USERNAME: "deepmandloi",
} satisfies NodeJS.ProcessEnv;

describe("getServerEnv", () => {
	it("parses a complete openrouter env", () => {
		const env = getServerEnv(completeOpenRouter);
		expect(env.OPENROUTER_API_KEY).toBe("sk-or-xxx");
		expect(env.LLM_PROVIDER).toBe("openrouter");
		expect(env.GITHUB_USERNAME).toBe("deepmandloi");
	});

	it("parses a complete gemini env", () => {
		const env = getServerEnv(completeGemini);
		expect(env.LLM_PROVIDER).toBe("gemini");
		expect(env.GEMINI_API_KEY).toBe("AIza-xxx");
	});

	it("makes IPINFO_TOKEN optional", () => {
		const env = getServerEnv(completeOpenRouter);
		expect(env.IPINFO_TOKEN).toBeUndefined();
	});

	it("defaults LLM_PROVIDER to openrouter", () => {
		const env = getServerEnv(completeOpenRouter);
		expect(env.LLM_PROVIDER).toBe("openrouter");
	});

	it("throws when LLM_PROVIDER=openrouter but no key", () => {
		expect(() =>
			getServerEnv({
				LLM_PROVIDER: "openrouter",
				GITHUB_TOKEN: "t",
				GITHUB_USERNAME: "u",
			}),
		).toThrow(/OPENROUTER_API_KEY/);
	});

	it("throws when LLM_PROVIDER=gemini but no key", () => {
		expect(() =>
			getServerEnv({
				LLM_PROVIDER: "gemini",
				GITHUB_TOKEN: "t",
				GITHUB_USERNAME: "u",
			}),
		).toThrow(/GEMINI_API_KEY/);
	});

	it("throws naming the missing base-required keys first", () => {
		try {
			getServerEnv({});
			expect.fail("should have thrown");
		} catch (err) {
			const msg = (err as Error).message;
			// Base schema errors fire before the provider-specific superRefine.
			expect(msg).toMatch(/GITHUB_TOKEN/);
			expect(msg).toMatch(/GITHUB_USERNAME/);
		}
	});
});

describe("getLlmConfig", () => {
	it("returns openrouter config with the validated default model", () => {
		const env = getServerEnv(completeOpenRouter);
		const cfg = getLlmConfig(env);
		expect(cfg.provider).toBe("openrouter");
		expect(cfg.apiKey).toBe("sk-or-xxx");
		expect(cfg.defaultModel).toBe("google/gemini-2.5-flash-lite");
	});

	it("returns gemini config when LLM_PROVIDER=gemini", () => {
		const env = getServerEnv(completeGemini);
		const cfg = getLlmConfig(env);
		expect(cfg.provider).toBe("gemini");
		expect(cfg.apiKey).toBe("AIza-xxx");
		expect(cfg.defaultModel).toBe("gemini-2.5-flash-lite");
	});

	it("falls back to the canonical default when GEMINI_DEFAULT_MODEL is unknown", () => {
		const env = getServerEnv({
			LLM_PROVIDER: "gemini",
			GEMINI_API_KEY: "AIza-xxx",
			GEMINI_DEFAULT_MODEL: "not-a-model",
			GITHUB_TOKEN: "t",
			GITHUB_USERNAME: "u",
		});
		const cfg = getLlmConfig(env);
		expect(cfg.defaultModel).toBe("gemini-2.5-flash-lite");
	});
});
