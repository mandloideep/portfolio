import { z } from "zod";
import {
	getAvailableModels,
	getDefaultModel,
	getModel,
	getProviderForModel,
	isModelAllowed,
	type LlmModel,
	type Provider,
} from "#/lib/agent/models";

/**
 * Server-side env validation.
 *
 * Importing this module from a browser bundle is a programming error and
 * will throw immediately. Call `getServerEnv()` from server-only code paths
 * (route loaders, API handlers, build scripts). The parse runs once and the
 * result is cached.
 *
 * Provider model:
 *   • Both `OPENROUTER_API_KEY` and `GEMINI_API_KEY` may be set. The unified
 *     model catalog auto-filters to models whose provider key is configured,
 *     so a dev with only one key still gets a working subset.
 *   • At least one of the two keys must be set.
 *   • `LLM_PROVIDER` picks the *preferred* provider for the default model
 *     when both keys are present. It no longer gates which models the
 *     catalog exposes.
 */

// `.env` templates ship every key as `KEY=` (empty string). Treat blanks as
// absent so an unused provider's key doesn't trip `.min(1)` on the wrong
// side of the provider switch.
const optionalString = z.preprocess(
	(v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
	z.string().min(1).optional(),
);

const ServerEnvSchema = z
	.object({
		LLM_PROVIDER: z.enum(["openrouter", "gemini"]).default("openrouter"),

		OPENROUTER_API_KEY: optionalString,
		OPENROUTER_DEFAULT_MODEL: optionalString,

		GEMINI_API_KEY: optionalString,
		GEMINI_DEFAULT_MODEL: optionalString,

		GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
		GITHUB_USERNAME: z.string().min(1, "GITHUB_USERNAME is required"),
		IPINFO_TOKEN: optionalString,

		// Rate limiting + abuse defenses.
		RATE_LIMIT_SALT: optionalString,
		// Legacy per-IP daily message cap. Now only consulted for free
		// models when `FREE_MODEL_PER_IP_LIMIT > 0`; free models otherwise
		// rely on Google's shared per-minute / per-UTC-day quotas. Premium
		// uses `PREMIUM_LIMIT` instead. Default raised to 1000 so any
		// remaining reads don't accidentally cap free traffic.
		RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
		// Per-IP daily message cap for free models. `0` (default) = unlimited
		// per-visitor; only the shared per-minute (rolling 60s) and per-UTC-day
		// model quotas apply. Set > 0 as an escape hatch if a visitor abuses.
		FREE_MODEL_PER_IP_LIMIT: z.coerce.number().int().nonnegative().default(0),
		// Per-IP daily cap for premium models (Gemini 2.5 Flash Lite).
		// Default 10 keeps us comfortably under Google's 20 RPD ceiling.
		PREMIUM_LIMIT: z.coerce.number().int().positive().default(10),
		RATE_LIMIT_WINDOW_MS: z.coerce
			.number()
			.int()
			.positive()
			.default(24 * 60 * 60 * 1000),
		DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(200_000),
		// Per-IP token budget. Bumped from 20k because per-IP message count
		// is now unlimited on free models, so this becomes the primary
		// anti-abuse guardrail.
		PER_IP_TOKEN_BUDGET: z.coerce.number().int().positive().default(40_000),
		BLOCK_VPN: z
			.preprocess(
				(v) => (typeof v === "string" ? v.toLowerCase() : v),
				z.enum(["true", "false"]).default("true"),
			)
			.transform((v) => v === "true"),
		WORD_CAP: z.coerce.number().int().positive().default(30),
		// Classifier runs on a fast non-reasoning model (Gemini 2.5 Flash
		// Lite) so the round-trip is ~1s instead of Gemma's ~5s reasoning
		// delay. Cheap enough at ~$0.00005/call that 1k visitor messages
		// cost about a nickel.
		CLASSIFIER_ENABLED: z
			.preprocess(
				(v) => (typeof v === "string" ? v.toLowerCase() : v),
				z.enum(["true", "false"]).default("true"),
			)
			.transform((v) => v === "true"),
		CLASSIFIER_MODEL: optionalString,
		// Optional dedicated provider for the classifier. When unset, the
		// classifier inherits the main `LLM_PROVIDER`. Setting to
		// `openrouter` lets us route the classifier to a free reasoning
		// model on OpenRouter while keeping Gemini for the main reply.
		CLASSIFIER_PROVIDER: z.enum(["openrouter", "gemini"]).optional(),
		// Free model pinned for classifier + commentary. Defaults to Gemma 4 31B
		// so gating logic never touches the premium quota.
		LLM_FREE_MODEL: optionalString,
		// Generous because Gemma's reasoning block eats 200–400 tokens
		// before the visible reply starts. 2048 leaves comfortable room for
		// the actual answer after thoughts. Gemma is free + unlimited TPM,
		// so this only affects latency on long replies, not cost.
		MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2048),
		MIN_REQUEST_INTERVAL_MS: z.coerce
			.number()
			.int()
			.nonnegative()
			.default(2000),
		// Gemma 4 31B is a reasoning model — complex prompts can spend
		// 15-25s in <thought> before the first visible token streams.
		// 45s leaves comfortable headroom over the worst-case thinking.
		REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),

		// Optional observability hooks.
		SENTRY_DSN: optionalString,
		BUDGET_ALERT_WEBHOOK_URL: optionalString,

		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
	})
	.superRefine((env, ctx) => {
		// Either or both keys may be set. We need at least one so the
		// catalog filter has something to expose.
		if (!env.OPENROUTER_API_KEY && !env.GEMINI_API_KEY) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["OPENROUTER_API_KEY"],
				message:
					"At least one of OPENROUTER_API_KEY or GEMINI_API_KEY must be set.",
			});
		}
		// The preferred provider (LLM_PROVIDER) is the one we try first when
		// choosing a default model. If it has no key, fall back to the other
		// provider silently — but if neither has one, the check above fires.

		// In production, RATE_LIMIT_SALT must be set to a non-default secret.
		// Without it, agent IPs would be hashed with a public literal,
		// defeating the privacy goal.
		if (env.NODE_ENV === "production") {
			if (!env.RATE_LIMIT_SALT || env.RATE_LIMIT_SALT === LEGACY_DEFAULT_SALT) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["RATE_LIMIT_SALT"],
					message:
						"RATE_LIMIT_SALT must be set to a random secret in production (use `openssl rand -hex 32`).",
				});
			}
		}

		// VPN blocking depends on IPInfo lookups. If BLOCK_VPN is on but no
		// token is configured, the privacy lookup is a no-op and the block
		// silently does nothing. Enforced only in production so dev/test —
		// where the default BLOCK_VPN=true is fine without a real token —
		// keeps working.
		if (env.NODE_ENV === "production" && env.BLOCK_VPN && !env.IPINFO_TOKEN) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["IPINFO_TOKEN"],
				message:
					"IPINFO_TOKEN is required when BLOCK_VPN=true. Set the token, or set BLOCK_VPN=false to disable VPN blocking.",
			});
		}
	});

const LEGACY_DEFAULT_SALT = "portfolio-default-salt";

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(
	source: NodeJS.ProcessEnv = process.env,
): ServerEnv {
	if (source === process.env && typeof window !== "undefined") {
		throw new Error(
			"getServerEnv() called from client code. Move the call to a server-only module.",
		);
	}
	if (cached && source === process.env) return cached;

	const result = ServerEnvSchema.safeParse(source);
	if (!result.success) {
		const missing = result.error.issues
			.map((i) => `${i.path.join(".")}: ${i.message}`)
			.join("\n  ");
		throw new Error(
			`Invalid server environment:\n  ${missing}\n\nSee .env.example for the expected keys.`,
		);
	}

	if (source === process.env) cached = result.data;
	return result.data;
}

/** Return the API key for a given provider, or `null` when not configured. */
export function getApiKeyForProvider(
	env: ServerEnv,
	p: Provider,
): string | null {
	if (p === "gemini") return env.GEMINI_API_KEY ?? null;
	return env.OPENROUTER_API_KEY ?? null;
}

/** The model catalog visible to this deploy (filtered by which keys are set). */
export function getAvailableCatalog(
	env: ServerEnv = getServerEnv(),
): readonly LlmModel[] {
	return getAvailableModels(env);
}

/**
 * Resolve the full per-model config (provider + apiKey + canonical id). The
 * api route uses this once per request after validating the user-requested
 * model against the available catalog.
 */
export function getModelConfig(
	env: ServerEnv,
	id: string,
): { provider: Provider; apiKey: string; model: string } | null {
	const provider = getProviderForModel(id);
	if (!provider) return null;
	const apiKey = getApiKeyForProvider(env, provider);
	if (!apiKey) return null;
	return { provider, apiKey, model: id };
}

/**
 * Pick a default model when the caller hasn't requested one. Honors the
 * preferred provider (`LLM_PROVIDER`) when both keys are present and the
 * preferred provider has a free model; otherwise falls back to the first
 * free model whose key is set, then to any model.
 */
export function resolveDefaultModel(env: ServerEnv = getServerEnv()): LlmModel {
	const available = getAvailableCatalog(env);
	const overrideId =
		env.LLM_PROVIDER === "gemini"
			? env.GEMINI_DEFAULT_MODEL
			: env.OPENROUTER_DEFAULT_MODEL;
	if (overrideId && isModelAllowed(overrideId)) {
		const m = getModel(overrideId);
		if (m && available.includes(m)) return m;
	}
	const preferredFree = available.find(
		(m) => m.provider === env.LLM_PROVIDER && m.tier === "free",
	);
	if (preferredFree) return preferredFree;
	return getDefaultModel(env);
}

/**
 * Legacy single-provider config shape. Kept so existing callers (tests,
 * commentary route) keep working — returns the provider + key + id of the
 * default model. New code should use `getModelConfig(env, modelId)`.
 */
export function getLlmConfig(env: ServerEnv = getServerEnv()): {
	provider: Provider;
	apiKey: string;
	defaultModel: string;
} {
	const model = resolveDefaultModel(env);
	const apiKey = getApiKeyForProvider(env, model.provider);
	if (!apiKey) {
		throw new Error(
			`No API key configured for the default model's provider (${model.provider}). Set ${model.provider === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY"}.`,
		);
	}
	return { provider: model.provider, apiKey, defaultModel: model.id };
}

/**
 * Resolve the classifier's (provider, apiKey, model). The classifier can
 * optionally run on a different provider than the main reply — handy when
 * we want a free, fast model from OpenRouter (e.g. nvidia/nemotron) while
 * the user-visible answer comes from Gemini.
 *
 * Falls back to the main provider when `CLASSIFIER_PROVIDER` is unset.
 */
export function getClassifierConfig(env: ServerEnv = getServerEnv()): {
	provider: Provider;
	apiKey: string;
	model: string;
} | null {
	const main = getLlmConfig(env);
	const provider = env.CLASSIFIER_PROVIDER ?? main.provider;
	const apiKey =
		provider === "gemini" ? env.GEMINI_API_KEY : env.OPENROUTER_API_KEY;
	if (!apiKey) return null; // No key for this provider → classifier disabled.
	const model =
		env.CLASSIFIER_MODEL ??
		(provider === "openrouter"
			? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
			: "gemini-2.5-flash-lite");
	return { provider, apiKey, model };
}

/** Test-only: clear the cached env so the next call re-parses process.env. */
export function _resetEnvCacheForTests(): void {
	cached = null;
}
