/**
 * Read-only virtual filesystem backing the terminal's shell mode. Built from
 * the same `corpusRecord` glob used by /me, /experience, etc. — no second
 * glob, no real fs access.
 *
 * Paths are POSIX-style with `~` as the home root (also accepted as `/`).
 * Stored cwd always normalizes to `~` or `~/segment[/segment...]`.
 */

import { corpusRecord } from "./corpus";

const CORPUS_PREFIX = "/src/content/agent/";
export const HOME = "~";

export type VfsFile = {
	kind: "file";
	name: string;
	path: string;
	content: string;
};

export type VfsDir = {
	kind: "dir";
	name: string;
	path: string;
	children: Map<string, VfsNode>;
};

export type VfsNode = VfsFile | VfsDir;

function makeDir(name: string, path: string): VfsDir {
	return { kind: "dir", name, path, children: new Map() };
}

function buildTree(): VfsDir {
	const root = makeDir("", HOME);
	for (const [absKey, content] of Object.entries(corpusRecord)) {
		if (!absKey.startsWith(CORPUS_PREFIX)) continue;
		const rel = absKey.slice(CORPUS_PREFIX.length);
		if (!rel) continue;
		const parts = rel.split("/").filter(Boolean);
		if (parts.length === 0) continue;
		let cursor: VfsDir = root;
		for (let i = 0; i < parts.length - 1; i += 1) {
			const segment = parts[i] as string;
			let next = cursor.children.get(segment);
			if (!next) {
				next = makeDir(segment, joinSegments(cursor.path, segment));
				cursor.children.set(segment, next);
			} else if (next.kind !== "dir") {
				throw new Error(`vfs collision: ${segment} is both file and dir`);
			}
			cursor = next;
		}
		const fileName = parts[parts.length - 1] as string;
		cursor.children.set(fileName, {
			kind: "file",
			name: fileName,
			path: joinSegments(cursor.path, fileName),
			content,
		});
	}
	return root;
}

function joinSegments(parent: string, segment: string): string {
	return parent === HOME ? `${HOME}/${segment}` : `${parent}/${segment}`;
}

export const vfsRoot: VfsDir = buildTree();

/**
 * Collapse `.`, `..`, `~`, empty segments. Leading `/` is rewritten to `~`.
 * Going above `~` clamps to `~` (no escape).
 */
export function normalizePath(path: string): string {
	if (!path) return HOME;
	const trimmed = path.trim();
	if (!trimmed) return HOME;
	let working = trimmed;
	if (working === HOME || working === `${HOME}/`) return HOME;
	if (working.startsWith(`${HOME}/`)) working = working.slice(HOME.length + 1);
	else if (working === "/") return HOME;
	else if (working.startsWith("/")) working = working.slice(1);
	const segments = working.split("/").filter((p) => p.length > 0 && p !== ".");
	const stack: string[] = [];
	for (const seg of segments) {
		if (seg === "..") stack.pop();
		else if (seg === HOME) stack.length = 0;
		else stack.push(seg);
	}
	if (stack.length === 0) return HOME;
	return `${HOME}/${stack.join("/")}`;
}

export function resolvePath(cwd: string, arg: string): string {
	const target = (arg ?? "").trim();
	if (!target) return normalizePath(cwd);
	if (
		target === HOME ||
		target.startsWith(`${HOME}/`) ||
		target === "/" ||
		target.startsWith("/")
	) {
		return normalizePath(target);
	}
	const base = normalizePath(cwd);
	const joined = base === HOME ? `${HOME}/${target}` : `${base}/${target}`;
	return normalizePath(joined);
}

export function lookupNode(absPath: string): VfsNode | undefined {
	const normalized = normalizePath(absPath);
	if (normalized === HOME) return vfsRoot;
	const rel = normalized.slice(HOME.length + 1);
	const parts = rel.split("/").filter(Boolean);
	let cursor: VfsNode = vfsRoot;
	for (const segment of parts) {
		if (cursor.kind !== "dir") return undefined;
		const next = cursor.children.get(segment);
		if (!next) return undefined;
		cursor = next;
	}
	return cursor;
}

/**
 * Directories first (with trailing `/`), then files. Alphabetical within
 * each group — matches what users expect from `ls`.
 */
export function listDir(dir: VfsDir): string[] {
	const dirs: string[] = [];
	const files: string[] = [];
	for (const node of dir.children.values()) {
		if (node.kind === "dir") dirs.push(`${node.name}/`);
		else files.push(node.name);
	}
	dirs.sort();
	files.sort();
	return [...dirs, ...files];
}
