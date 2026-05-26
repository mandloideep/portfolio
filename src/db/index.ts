import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema.ts";

/**
 * Lazily-initialized Postgres client. `drizzle()` is called the first time
 * any code touches a property on `db`, not at module load — that way the
 * build (`vite build` + prerender) can import route modules that import
 * this file without needing DATABASE_URL set. Routes that prerender
 * statically (`/`, `/terminal`) never query, so they should never trip the
 * env check. Routes that do query (`/api/agent`, `/api/github-graph`)
 * still throw clearly on the first request if DATABASE_URL is missing.
 */

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

function getDb(): Db {
	if (cached) return cached;
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error(
			"DATABASE_URL is not set. Required for any code path that hits Postgres.",
		);
	}
	cached = drizzle(url, { schema });
	return cached;
}

export const db = new Proxy({} as Db, {
	get(_target, prop) {
		const real = getDb() as unknown as Record<string | symbol, unknown>;
		const value = real[prop];
		return typeof value === "function" ? value.bind(real) : value;
	},
}) as Db;
