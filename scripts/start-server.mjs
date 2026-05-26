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

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

const server = serve({
	port,
	hostname,
	fetch: handler.fetch,
	middleware: [serveStatic({ dir: clientDir })],
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
