import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { HelloLoader } from "#/components/portfolio/hello-loader";
import { QuipProvider } from "#/components/quip-provider";
import { siteMeta } from "#/content/site";
import { themes } from "#/content/themes";
import { buildOpenGraphMeta, buildPersonJsonLd } from "#/lib/seo";
import { generateThemeCss } from "#/lib/theme-css";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

declare global {
	interface Window {
		__QUIP_SEED__?: number;
		__QUIP_AT__?: number;
	}
}

export const ROOT_TITLE = `${siteMeta.name} — ${siteMeta.role}`;

const themeCss = generateThemeCss(themes);
const personJsonLd = JSON.stringify(buildPersonJsonLd(siteMeta, siteMeta.url));

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{ title: ROOT_TITLE },
			{ name: "description", content: siteMeta.description },
			...buildOpenGraphMeta({
				title: ROOT_TITLE,
				description: siteMeta.description,
				path: "/",
				siteMeta,
			}),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/favicon.ico",
				sizes: "32x32",
			},
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	// Shared quip seed + the time this HTML was rendered, handed to the client
	// via the inline script below (it runs before the bundle, so the provider
	// reads them on first render → hydration matches, no mismatch).
	//
	// `renderedAt` is the freshness signal: for a per-request SSR route (/chat)
	// it's ~now, so the client keeps the server's quip (no reroll, no flash).
	// For a prerendered route (/, /terminal) it's frozen at build time, so the
	// client sees a stale timestamp and rerolls to a fresh pick — the only way
	// to rotate on a static page, which has no per-request server.
	const onServer = typeof window === "undefined";
	const quipSeed = onServer
		? Math.floor(Math.random() * 1e9)
		: (window.__QUIP_SEED__ ?? Math.floor(Math.random() * 1e9));
	const quipRenderedAt = onServer
		? Date.now()
		: (window.__QUIP_AT__ ?? Date.now());

	return (
		<html lang="en" data-theme="nord-green">
			<head>
				<HeadContent />
				{/* Theme CSS variables, generated from the registry */}
				<style
					// biome-ignore lint/security/noDangerouslySetInnerHtml: theme CSS is built from a typed registry, no user input
					dangerouslySetInnerHTML={{ __html: themeCss }}
				/>
				<script
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is built from typed siteMeta
					dangerouslySetInnerHTML={{ __html: personJsonLd }}
				/>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: numeric values only, no user input
					dangerouslySetInnerHTML={{
						__html: `window.__QUIP_SEED__=${quipSeed};window.__QUIP_AT__=${quipRenderedAt}`,
					}}
				/>
			</head>
			<body>
				<a
					href="#main"
					className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-accent focus:text-bg focus:px-3 focus:py-1 focus:rounded"
				>
					Skip to main content
				</a>
				<HelloLoader />
				<QuipProvider seed={quipSeed} renderedAt={quipRenderedAt}>
					<div>{children}</div>
				</QuipProvider>
				<Scripts />
			</body>
		</html>
	);
}
