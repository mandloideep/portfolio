/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import neon from "./neon-vite-plugin.ts";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		neon,
		tailwindcss(),
		tanstackStart({
			pages: [
				{ path: "/", prerender: { enabled: true } },
				{ path: "/terminal", prerender: { enabled: true } },
			],
			// crawlLinks:false — the prerender plugin's URL normalization
			// (ufo.withTrailingSlash) mangles query-string links such as
			// `/?choose=1` into `/?choose=1/`, which then 500s when the
			// route's Zod search-param schema rejects the trailing slash.
			// We only need the explicitly listed pages prerendered.
			prerender: {
				failOnError: true,
				concurrency: 4,
				crawlLinks: false,
			},
		}),
		viteReact(),
	],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
	},
});

export default config;
