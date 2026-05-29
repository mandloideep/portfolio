import * as Sentry from "@sentry/node";

/**
 * Server-side Sentry init. No-op when SENTRY_DSN is unset (default), so
 * dev + self-hosted users without a Sentry project pay no runtime cost.
 *
 * Initializes exactly once via the module-load guard below.
 */

let initialized = false;

export function initSentryServer(): void {
	if (initialized) return;
	const dsn = process.env.SENTRY_DSN;
	if (!dsn) return;
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV ?? "development",
		tracesSampleRate: 0.05,
		// Don't capture PII by default — visitor messages are never sent here.
		sendDefaultPii: false,
	});
	initialized = true;
}

export function captureException(
	err: unknown,
	context?: Record<string, unknown>,
): void {
	if (!initialized) return;
	Sentry.captureException(err, context ? { extra: context } : undefined);
}

// Initialize on module load — server-only modules import this once.
initSentryServer();
