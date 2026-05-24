import { Streamdown } from "streamdown";
import { cn } from "#/lib/utils";

/**
 * Renders a `markdown` block's text via streamdown (already in deps; Phase 6
 * will reuse it for SSE-streamed agent responses).
 *
 * Theming is left to Tailwind typography (`prose`) + the theme tokens defined
 * in `src/styles.css`. Default streamdown shiki theme is fine for v1 — the
 * agent corpus is mostly prose.
 */
export function MarkdownBlock({ text }: { text: string }) {
	return (
		<Streamdown
			mode="static"
			parseIncompleteMarkdown={false}
			className={cn(
				"prose prose-invert prose-sm max-w-none text-fg",
				"prose-headings:text-fg prose-headings:font-semibold",
				"prose-a:text-accent prose-a:no-underline hover:prose-a:underline",
				"prose-strong:text-fg prose-code:text-accent",
				"prose-li:my-0 prose-p:my-2",
			)}
		>
			{text}
		</Streamdown>
	);
}
