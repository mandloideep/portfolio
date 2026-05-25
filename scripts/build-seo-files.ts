#!/usr/bin/env tsx
/**
 * pnpm build-seo
 *
 * Regenerates public/sitemap.xml and public/robots.txt from the typed
 * helpers in #/lib/seo. Run this when adding a public route.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteMeta } from "../src/content/site.ts";
import { buildRobotsTxt, buildSitemapXml } from "../src/lib/seo.ts";

const ORIGIN = siteMeta.url;
const ROUTES = ["/", "/terminal"] as const;

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public");

writeFileSync(join(publicDir, "sitemap.xml"), buildSitemapXml(ROUTES, ORIGIN));
writeFileSync(join(publicDir, "robots.txt"), buildRobotsTxt(ORIGIN));

console.log(`wrote public/sitemap.xml (${ROUTES.length} routes) + public/robots.txt`);
