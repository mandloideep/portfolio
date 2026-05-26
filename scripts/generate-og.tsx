/**
 * Build-time OG image generation.
 *
 * Renders one 1200x630 PNG per shareable URL using Satori (JSX → SVG) and
 * @resvg/resvg-js (SVG → PNG, pure WASM). Run as the `prebuild` hook so
 * every `pnpm build` regenerates fresh PNGs into `public/og/`, which Vite
 * then copies into `dist/client/og/`.
 *
 * To add a new shareable card, append to the `pages` array below and
 * reference the output path from the route's `head()` function.
 *
 * No external network calls. No native deps. Fonts shipped by
 * @fontsource/inter (WOFF, accepted by Satori 0.26+).
 */

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { projects, siteMeta } from "../src/content/site";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const outDir = resolve(repoRoot, "public", "og");
const fontDir = resolve(
	repoRoot,
	"node_modules",
	"@fontsource",
	"inter",
	"files",
);

const fontRegular = readFileSync(resolve(fontDir, "inter-latin-400-normal.woff"));
const fontBold = readFileSync(resolve(fontDir, "inter-latin-700-normal.woff"));

type Page = { slug: string; title: string; subtitle: string };

const pages: Page[] = [
	{
		slug: "home",
		title: siteMeta.name,
		subtitle: siteMeta.role,
	},
	{
		slug: "chat",
		title: `Chat with ${siteMeta.name.split(" ")[0]}`,
		subtitle: "Ask about projects, work, and experience.",
	},
	{
		slug: "terminal",
		title: `${siteMeta.name} — terminal`,
		subtitle: "A Claude-code-style portfolio agent.",
	},
	{
		slug: "github",
		title: `${siteMeta.name} on GitHub`,
		subtitle: "Contributions, languages, and recent work.",
	},
	...projects.map(
		(p): Page => ({
			slug: `projects/${p.slug}`,
			title: p.title,
			subtitle: p.summary,
		}),
	),
];

function Card({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "80px",
				background: "#0d0e13",
				color: "#ffffff",
				fontFamily: "Inter",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
				<div
					style={{
						width: "14px",
						height: "14px",
						borderRadius: "999px",
						background: "#5ee68d",
					}}
				/>
				<div
					style={{
						fontSize: "26px",
						color: "#8a8e98",
						letterSpacing: "0.02em",
					}}
				>
					{siteMeta.url.replace(/^https?:\/\//, "")}
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
				<div
					style={{
						fontSize: "84px",
						fontWeight: 700,
						lineHeight: 1.05,
						letterSpacing: "-0.02em",
					}}
				>
					{title}
				</div>
				<div
					style={{
						fontSize: "36px",
						color: "#8a8e98",
						lineHeight: 1.3,
						maxWidth: "950px",
					}}
				>
					{subtitle}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					fontSize: "24px",
					color: "#8a8e98",
				}}
			>
				<div style={{ display: "flex" }}>{siteMeta.location}</div>
				<div style={{ display: "flex", color: "#5ee68d" }}>
					{siteMeta.status}
				</div>
			</div>
		</div>
	);
}

async function renderOne(page: Page): Promise<void> {
	const svg = await satori(<Card title={page.title} subtitle={page.subtitle} />, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: "Inter", data: fontRegular, weight: 400, style: "normal" },
			{ name: "Inter", data: fontBold, weight: 700, style: "normal" },
		],
	});
	const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
		.render()
		.asPng();
	const filepath = resolve(outDir, `${page.slug}.png`);
	await mkdir(dirname(filepath), { recursive: true });
	await writeFile(filepath, png);
	console.log(`og: wrote ${page.slug}.png (${(png.byteLength / 1024).toFixed(1)} KB)`);
}

async function main(): Promise<void> {
	await mkdir(outDir, { recursive: true });
	for (const page of pages) {
		await renderOne(page);
	}
	console.log(`og: generated ${pages.length} images in public/og/`);
}

main().catch((err) => {
	console.error("og: generation failed", err);
	process.exit(1);
});
