import type { Block } from "#/lib/terminal/blocks";
import { cn } from "#/lib/utils";

/**
 * Exhaustive switch over `Block` discriminated union. Adding a new kind to
 * `Block` without a case here is a TS error via `assertNever`.
 */
export function BlockRow({ block }: { block: Block }) {
	switch (block.kind) {
		case "prompt":
			return (
				<div data-block="prompt" className="flex gap-2 text-fg">
					<span className="text-accent select-none shrink-0">
						{block.mode === "shell"
							? "deep@portfolio:~ $"
							: "deep@portfolio:~ ❯"}
					</span>
					<span className="whitespace-pre-wrap break-words">{block.text}</span>
				</div>
			);
		case "output":
			return (
				<div data-block="output" className="whitespace-pre-wrap text-fg">
					{block.text}
				</div>
			);
		case "markdown":
			return (
				<div data-block="markdown" className="whitespace-pre-wrap text-fg">
					{block.text}
				</div>
			);
		case "error":
			return (
				<div
					data-block="error"
					className={cn("whitespace-pre-wrap text-error")}
				>
					{block.text}
				</div>
			);
		case "system":
			return (
				<div
					data-block="system"
					className="whitespace-pre-wrap text-muted italic"
				>
					{block.text}
				</div>
			);
		case "activity":
			return (
				<div
					data-block="activity"
					className="whitespace-pre-wrap text-muted text-xs"
				>
					{block.text}
				</div>
			);
		default:
			return assertNever(block);
	}
}

function assertNever(x: never): never {
	throw new Error(`unhandled block kind: ${JSON.stringify(x)}`);
}
