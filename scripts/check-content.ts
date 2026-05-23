#!/usr/bin/env tsx
/**
 * pnpm check-content
 *
 * Asserts that every `projects[].slug` in src/content/site.ts has a matching
 * markdown file at src/content/agent/projects/<slug>.md, and vice versa.
 * Exits non-zero on mismatch.
 */

import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { projects } from "../src/content/site.ts";
import { checkProjectSync } from "./content-sync.ts";

const here = dirname(fileURLToPath(import.meta.url));
const projectsDir = join(here, "..", "src", "content", "agent", "projects");

const filenames = readdirSync(projectsDir);
const report = checkProjectSync(
	projects.map((p) => p.slug),
	filenames,
);

if (!report.ok) {
	if (report.missing.length) {
		console.error(
			`missing markdown for project slugs:\n  - ${report.missing.join(
				"\n  - ",
			)}`,
		);
	}
	if (report.extra.length) {
		console.error(
			`extra markdown files (no matching project):\n  - ${report.extra.join(
				"\n  - ",
			)}`,
		);
	}
	process.exit(1);
}

console.log(
	`content sync ok · ${projects.length} projects matched ${filenames.filter((f) => f.endsWith(".md")).length} markdown files`,
);
