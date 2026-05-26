import { z } from "zod";
import {
	getDefaultModelForProvider,
	isModelForProvider,
	type Provider,
} from "#/lib/openrouter";

/**
 * Server-side env validation.
 *
 * Importing this module from a browser bundle is a programming error and
 * will throw immediately. Call `getServerEnv()` from server-only code paths
 * (route loaders, API handlers, build scripts). The parse runs once and the
 * result is cached.
 *
 * Provider selection:
 *   • `LLM_PROVIDER=openrouter|gemini` picks the active provider. Defaults
 *     to `openrouter` if unset.
 *   • Each provider requires its own API key. The other key is optional —
 *     handy when you keep both configured and flip via `LLM_PROVIDER`.
 *   • `*_DEFAULT_MODEL` overrides the provider's first-in-list default.
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
		// Total messages per IP per day (any model). Bumped to 15 because Gemma's
		// free-tier headroom is huge; premium use is capped separately.
		RATE_LIMIT_MAX: z.coerce.number().int().positive().default(15),
		// Sub-budget for paid models (currently just Gemini 2.5 Flash Lite).
		PREMIUM_LIMIT: z.coerce.number().int().positive().default(5),
		RATE_LIMIT_WINDOW_MS: z.coerce
			.number()
			.int()
			.positive()
			.default(24 * 60 * 60 * 1000),
		DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(200_000),
		PER_IP_TOKEN_BUDGET: z.coerce.number().int().positive().default(20_000),
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
	})
	.superRefine((env, ctx) => {
		if (env.LLM_PROVIDER === "openrouter" && !env.OPENROUTER_API_KEY) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["OPENROUTER_API_KEY"],
				message: "OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter",
			});
		}
		if (env.LLM_PROVIDER === "gemini" && !env.GEMINI_API_KEY) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["GEMINI_API_KEY"],
				message: "GEMINI_API_KEY is required when LLM_PROVIDER=gemini",
			});
		}
	});

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

/**
 * Resolve the API key + default model + canonical id for the active
 * provider. Throws with a clear message if the requested provider lacks
 * a key — the superRefine above usually catches this earlier, but this
 * guards against direct callers that bypass `getServerEnv()`.
 */
export function getLlmConfig(env: ServerEnv = getServerEnv()): {
	provider: Provider;
	apiKey: string;
	defaultModel: string;
} {
	const provider = env.LLM_PROVIDER;
	const apiKey =
		provider === "gemini" ? env.GEMINI_API_KEY : env.OPENROUTER_API_KEY;
	if (!apiKey) {
		throw new Error(
			`No API key configured for LLM_PROVIDER=${provider}. Set ${provider === "gemini" ? "GEMINI_API_KEY" : "OPENROUTER_API_KEY"}.`,
		);
	}
	const overrideDefault =
		provider === "gemini"
			? env.GEMINI_DEFAULT_MODEL
			: env.OPENROUTER_DEFAULT_MODEL;
	const defaultModel =
		overrideDefault && isModelForProvider(provider, overrideDefault)
			? overrideDefault
			: getDefaultModelForProvider(provider);
	return { provider, apiKey, defaultModel };
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
