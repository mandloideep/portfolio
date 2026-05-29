// Production server entry. Wraps the TanStack Start build (`dist/server/server.js`),
// which exports a fetch handler, in a Node HTTP listener via srvx. Serves
// static assets from `dist/client/` (Vite output) so hashed JS/CSS, fonts,
// og.png, robots.txt etc. are reachable without a separate web server.
//
// Runtime command for the Docker image and any non-edge deployment.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { serve } from "srvx/node";
import { serveStatic } from "srvx/static";
import handler from "../dist/server/server.js";

const here = dirname(fileURLToPath(import.meta.url));
const clientDir = resolve(here, "..", "dist", "client");

const port = Number(process.env.PORT ?? 8080);
const hostname = process.env.HOST ?? "0.0.0.0";

// Security headers for every response. We handle these in-app rather than via a
// Traefik middleware so they're versioned with the code and travel with the
// image. `'unsafe-inline'` stays on script-/style-src because __root.tsx inlines
// theme CSS, JSON-LD, and the quip-seed script via dangerouslySetInnerHTML;
// nonces aren't viable here (prerendered static HTML can't carry a per-request
// nonce, and TanStack Start doesn't nonce all its injected scripts yet). The
// strict directives below — object-src/base-uri/frame-ancestors + the
// connect-src allowlist — are where the real protection lives.
const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline' fonts.googleapis.com",
	"font-src 'self' fonts.gstatic.com data:",
	"img-src 'self' data: https:",
	"connect-src 'self' https://openrouter.ai https://generativelanguage.googleapis.com https://api.github.com https://ipinfo.io https://*.sentry.io",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = {
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"Content-Security-Policy": CONTENT_SECURITY_POLICY,
};

async function withHeaders(request, next) {
	const res = await next();
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		res.headers.set(key, value);
	}
	// Long-cache content-hashed assets. Leave responses that already declare a
	// Cache-Control untouched (the API routes set their own no-store / max-age).
	if (!res.headers.has("Cache-Control")) {
		const { pathname } = new URL(request.url);
		if (pathname.startsWith("/assets/") || pathname.startsWith("/fonts/")) {
			res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
		}
	}
	return res;
}

const server = serve({
	port,
	hostname,
	fetch: handler.fetch,
	middleware: [withHeaders, serveStatic({ dir: clientDir })],
});

await server.ready();
console.log(`portfolio listening on http://${hostname}:${port}`);

for (const sig of ["SIGINT", "SIGTERM"]) {
	process.once(sig, async () => {
		console.log(`received ${sig}, shutting down`);
		await server.close?.();
		process.exit(0);
	});
}
