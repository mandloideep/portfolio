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
					<span className="mr-2 select-none font-semibold uppercase tracking-eyebrow text-error/80 text-eyebrow">
						err
					</span>
					{block.text}
				</div>
			);
		case "system":
			return (
				<div data-block="system" className="whitespace-pre-wrap text-muted">
					<span className="mr-2 select-none font-semibold uppercase tracking-eyebrow text-muted/80 text-eyebrow">
						sys
					</span>
					{block.text}
				</div>
			);
		case "activity":
			return (
				<div
					data-block="activity"
					className="flex gap-2 whitespace-pre-wrap text-muted text-meta"
				>
					<span className="shrink-0 select-none text-muted/60">
						[{formatTs(block.ts)}]
					</span>
					<span>{block.text}</span>
				</div>
			);
		case "thinking":
			return (
				<div data-block="thinking" className="text-muted/85">
					<details
						open={!block.collapsed}
						className="group rounded-card border border-border/60 bg-bg/30 px-3 py-2 italic"
					>
						<summary className="cursor-pointer select-none list-none text-meta uppercase tracking-tab text-muted/70 [&::-webkit-details-marker]:hidden">
							<span className="mr-1.5 inline-block transition-transform group-open:rotate-90">
								▸
							</span>
							{block.collapsed ? "thought" : "thinking · streaming"}
							{block.collapsed && (block.durationMs || block.tokens) ? (
								<span className="ml-2 text-muted/60 normal-case tracking-normal">
									·{" "}
									{[
										typeof block.durationMs === "number"
											? `${block.durationMs}ms`
											: null,
										typeof block.tokens === "number"
											? `${block.tokens} tokens`
											: null,
									]
										.filter(Boolean)
										.join(" · ")}
								</span>
							) : null}
						</summary>
						<div
							className={cn(
								"mt-2 whitespace-pre-wrap text-sm leading-relaxed",
								!block.collapsed && "relative max-h-32 overflow-hidden",
							)}
						>
							{block.text}
							{!block.collapsed ? (
								<span
									aria-hidden="true"
									className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg/95 to-transparent"
								/>
							) : null}
						</div>
					</details>
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
