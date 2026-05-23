import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { siteMeta } from "#/content/site";
import { themes } from "#/content/themes";
import { buildPersonJsonLd } from "#/lib/seo";
import { generateThemeCss } from "#/lib/theme-css";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const TITLE = `${siteMeta.name} — ${siteMeta.role}`;
const DESCRIPTION =
	"Portfolio of Deep Mandloi: CS student, full-stack engineer, agent-tinkerer.";

const themeCss = generateThemeCss(themes);
const personJsonLd = JSON.stringify(buildPersonJsonLd(siteMeta));

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: "https://deepmandloi.com/" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: TITLE },
			{ name: "twitter:description", content: DESCRIPTION },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
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
			</head>
			<body>
				<a
					href="#main"
					className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-accent focus:text-bg focus:px-3 focus:py-1 focus:rounded"
				>
					Skip to main content
				</a>
				<div id="main">{children}</div>
				<Scripts />
			</body>
		</html>
	);
}
