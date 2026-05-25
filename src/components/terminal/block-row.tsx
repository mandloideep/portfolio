import type { Block } from "#/lib/terminal/blocks";
import { cn } from "#/lib/utils";
import { MarkdownBlock } from "./markdown-block";

/**
 * Exhaustive switch over `Block` discriminated union. Adding a new kind to
 * `Block` without a case here is a TS error via `assertNever`.
 *
 * Visual hierarchy: prompts get weight contrast (semibold accent prefix,
 * medium command body), errors get a left rule, system + activity gain
 * uppercase eyebrow tags so they're skimmable.
 */
export function BlockRow({ block }: { block: Block }) {
	switch (block.kind) {
		case "prompt":
			return (
				<div data-block="prompt" className="flex gap-2 text-fg">
					<span className="shrink-0 select-none font-semibold text-accent">
						{block.mode === "shell"
							? "deep@portfolio:~ $"
							: "deep@portfolio:~ ❯"}
					</span>
					<span className="whitespace-pre-wrap break-words font-medium">
						{block.text}
					</span>
				</div>
			);
		case "output":
			return (
				<div data-block="output" className="whitespace-pre-wrap text-fg/95">
					{block.text}
				</div>
			);
		case "markdown":
			return (
				<div data-block="markdown" className="text-fg">
					<MarkdownBlock text={block.text} />
				</div>
			);
		case "error":
			return (
				<div
					data-block="error"
					className={cn(
						"whitespace-pre-wrap border-l-2 border-error pl-3 text-error",
					)}
				>
					<span className="mr-2 select-none font-semibold uppercase tracking-[0.18em] text-error/80 text-[11px]">
						err
					</span>
					{block.text}
				</div>
			);
		case "system":
			return (
				<div data-block="system" className="whitespace-pre-wrap text-muted">
					<span className="mr-2 select-none font-semibold uppercase tracking-[0.18em] text-muted/80 text-[11px]">
						sys
					</span>
					{block.text}
				</div>
			);
		case "activity":
			return (
				<div
					data-block="activity"
					className="flex gap-2 whitespace-pre-wrap text-muted text-xs"
				>
					<span className="shrink-0 select-none text-muted/60">
						[{formatTs(block.ts)}]
					</span>
					<span>{block.text}</span>
				</div>
			);
		default:
			return assertNever(block);
	}
}

function formatTs(ts: number): string {
	const d = new Date(ts);
	const pad = (n: number) => n.toString().padStart(2, "0");
	return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function assertNever(x: never): never {
	throw new Error(`unhandled block kind: ${JSON.stringify(x)}`);
}
