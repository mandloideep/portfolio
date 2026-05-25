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

const ServerEnvSchema = z
	.object({
		LLM_PROVIDER: z.enum(["openrouter", "gemini"]).default("openrouter"),

		OPENROUTER_API_KEY: z.string().min(1).optional(),
		OPENROUTER_DEFAULT_MODEL: z.string().min(1).optional(),

		GEMINI_API_KEY: z.string().min(1).optional(),
		GEMINI_DEFAULT_MODEL: z.string().min(1).optional(),

		GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
		GITHUB_USERNAME: z.string().min(1, "GITHUB_USERNAME is required"),
		IPINFO_TOKEN: z.string().optional(),
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

/** Test-only: clear the cached env so the next call re-parses process.env. */
export function _resetEnvCacheForTests(): void {
	cached = null;
}
