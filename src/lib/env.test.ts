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
	GEMINI_DEFAULT_MODEL: "gemma-4-31b-it",
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

	it("throws when no LLM provider key is set", () => {
		// With dual-key support, the rule is now "at least one key required",
		// not "the LLM_PROVIDER's key required".
		expect(() =>
			getServerEnv({
				LLM_PROVIDER: "openrouter",
				GITHUB_TOKEN: "t",
				GITHUB_USERNAME: "u",
			}),
		).toThrow(/OPENROUTER_API_KEY|GEMINI_API_KEY/);
	});

	it("accepts a gemini-only deploy with no OPENROUTER_API_KEY", () => {
		const env = getServerEnv({
			LLM_PROVIDER: "gemini",
			GEMINI_API_KEY: "AIza-xxx",
			GITHUB_TOKEN: "t",
			GITHUB_USERNAME: "u",
		});
		expect(env.LLM_PROVIDER).toBe("gemini");
	});

	it("treats empty-string optional keys as absent (regression: bootstrap-template leftover)", () => {
		// `.env.example` ships every key as `KEY=` — the empty OpenRouter key
		// must not trip validation when the active provider is gemini.
		const env = getServerEnv({
			LLM_PROVIDER: "gemini",
			OPENROUTER_API_KEY: "",
			OPENROUTER_DEFAULT_MODEL: "",
			GEMINI_API_KEY: "AIza-xxx",
			GEMINI_DEFAULT_MODEL: "",
			IPINFO_TOKEN: "",
			GITHUB_TOKEN: "ghp_xxx",
			GITHUB_USERNAME: "deepmandloi",
		});
		expect(env.LLM_PROVIDER).toBe("gemini");
		expect(env.OPENROUTER_API_KEY).toBeUndefined();
		expect(env.GEMINI_DEFAULT_MODEL).toBeUndefined();
	});

	it("exposes rate-limit + abuse-defense defaults", () => {
		const env = getServerEnv(completeOpenRouter);
		// RATE_LIMIT_MAX is now only a legacy soft ceiling — free models
		// run uncapped per-IP via FREE_MODEL_PER_IP_LIMIT=0.
		expect(env.RATE_LIMIT_MAX).toBe(1000);
		expect(env.FREE_MODEL_PER_IP_LIMIT).toBe(0);
		expect(env.PREMIUM_LIMIT).toBe(10);
		expect(env.RATE_LIMIT_WINDOW_MS).toBe(86_400_000);
		expect(env.WORD_CAP).toBe(30);
		expect(env.BLOCK_VPN).toBe(true);
		expect(env.CLASSIFIER_ENABLED).toBe(true);
		expect(env.MAX_OUTPUT_TOKENS).toBe(2048);
		expect(env.MIN_REQUEST_INTERVAL_MS).toBe(2000);
		expect(env.REQUEST_TIMEOUT_MS).toBe(45_000);
		expect(env.DAILY_TOKEN_BUDGET).toBe(200_000);
		expect(env.PER_IP_TOKEN_BUDGET).toBe(40_000);
	});

	it("coerces BLOCK_VPN=false to boolean false", () => {
		const env = getServerEnv({ ...completeOpenRouter, BLOCK_VPN: "false" });
		expect(env.BLOCK_VPN).toBe(false);
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
	it("returns openrouter config for the default openrouter free model", () => {
		const env = getServerEnv(completeOpenRouter);
		const cfg = getLlmConfig(env);
		expect(cfg.provider).toBe("openrouter");
		expect(cfg.apiKey).toBe("sk-or-xxx");
		// Default falls back to the first available free model on the
		// preferred provider — the OpenRouter Gemma slug.
		expect(cfg.defaultModel).toBe("google/gemma-4-26b-a4b-it:free");
	});

	it("returns gemini config when LLM_PROVIDER=gemini", () => {
		const env = getServerEnv(completeGemini);
		const cfg = getLlmConfig(env);
		expect(cfg.provider).toBe("gemini");
		expect(cfg.apiKey).toBe("AIza-xxx");
		expect(cfg.defaultModel).toBe("gemma-4-31b-it");
	});

	it("falls back to the catalog default when GEMINI_DEFAULT_MODEL is unknown", () => {
		const env = getServerEnv({
			LLM_PROVIDER: "gemini",
			GEMINI_API_KEY: "AIza-xxx",
			GEMINI_DEFAULT_MODEL: "not-a-model",
			GITHUB_TOKEN: "t",
			GITHUB_USERNAME: "u",
		});
		const cfg = getLlmConfig(env);
		expect(cfg.defaultModel).toBe("gemma-4-31b-it");
	});
});
