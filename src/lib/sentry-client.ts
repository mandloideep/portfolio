import * as Sentry from "@sentry/react";

/**
 * Client-side Sentry init. Gated on import.meta.env.VITE_SENTRY_DSN — if
 * unset, Sentry never runs. Called once from src/router.tsx.
 */

let initialized = false;

export function initSentryClient(): void {
	if (initialized) return;
	const dsn = import.meta.env.VITE_SENTRY_DSN;
	if (typeof dsn !== "string" || dsn.length === 0) return;
	Sentry.init({
		dsn,
		environment: import.meta.env.MODE,
		tracesSampleRate: 0.05,
		sendDefaultPii: false,
	});
	initialized = true;
}
