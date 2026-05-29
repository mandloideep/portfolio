/**
 * Build-time icon generation.
 *
 * Renders the raster icons from the single source of truth, `public/favicon.svg`,
 * so the brand mark stays consistent and there's no hand-maintained PNG/ICO art.
 * Runs as part of the `prebuild` hook (alongside generate-og.tsx) so every
 * `pnpm build` regenerates them; output is deterministic for a given SVG.
 *
 *   logo192.png / logo512.png  → PWA manifest icons
 *   apple-touch-icon.png       → iOS home-screen icon (Safari needs PNG, not SVG)
 *   favicon.ico                → legacy fallback (a 32px PNG wrapped in an ICO)
 *
 * The modern browser tab icon is `favicon.svg` itself (referenced in __root.tsx);
 * these cover the cases that can't consume SVG.
 */

import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, "..", "public");
const svg = readFileSync(resolve(publicDir, "favicon.svg"), "utf8");

function renderPng(size: number): Buffer {
	return new Resvg(svg, { fitTo: { mode: "width", value: size } })
		.render()
		.asPng();
}

/** Wrap a square PNG in a single-entry ICO container (ICO supports PNG payloads). */
function pngToIco(png: Buffer, size: number): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(1, 2); // type: icon
	header.writeUInt16LE(1, 4); // image count

	const entry = Buffer.alloc(16);
	entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 ⇒ 256)
	entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
	entry.writeUInt8(0, 2); // palette colors
	entry.writeUInt8(0, 3); // reserved
	entry.writeUInt16LE(1, 4); // color planes
	entry.writeUInt16LE(32, 6); // bits per pixel
	entry.writeUInt32LE(png.length, 8); // image byte length
	entry.writeUInt32LE(header.length + 16, 12); // offset to image data

	return Buffer.concat([header, entry, png]);
}

const outputs: Array<readonly [string, Buffer]> = [
	["logo192.png", renderPng(192)],
	["logo512.png", renderPng(512)],
	["apple-touch-icon.png", renderPng(180)],
	["favicon.ico", pngToIco(renderPng(32), 32)],
];

await Promise.all(
	outputs.map(([name, buf]) => writeFile(resolve(publicDir, name), buf)),
);

console.log(
	`icons: generated ${outputs.map(([n]) => n).join(", ")} from favicon.svg`,
);
