import { z } from "zod";

/**
 * Server-side env validation.
 *
 * Importing this module from a browser bundle is a programming error and
 * will throw immediately. Call `getServerEnv()` from server-only code paths
 * (route loaders, API handlers, build scripts). The parse runs once and the
 * result is cached.
 */

const ServerEnvSchema = z.object({
	OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
	OPENROUTER_DEFAULT_MODEL: z
		.string()
		.min(1)
		.default("google/gemini-2.5-flash-lite"),
	GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
	GITHUB_USERNAME: z.string().min(1, "GITHUB_USERNAME is required"),
	IPINFO_TOKEN: z.string().optional(),
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

/** Test-only: clear the cached env so the next call re-parses process.env. */
export function _resetEnvCacheForTests(): void {
	cached = null;
}
