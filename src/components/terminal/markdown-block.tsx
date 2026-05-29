import { Streamdown } from "streamdown";
import { cn } from "#/lib/utils";

/**
 * Renders a `markdown` block's text via streamdown.
 *
 * Streaming mode is used unconditionally so the same component covers both
 * "agent response that grows token-by-token" (Phase 6 SSE) and "static
 * corpus dump" (content commands). `parseIncompleteMarkdown` handles the
 * partial-fence case gracefully and is a no-op when the text is complete.
 *
 * Prose colors derive from `.terminal-prose` token overrides in styles.css
 * so every theme reads correctly without `prose-invert`.
 */
export function MarkdownBlock({ text }: { text: string }) {
	return (
		<Streamdown
			mode="streaming"
			parseIncompleteMarkdown={true}
			className={cn(
				"terminal-prose prose prose-sm max-w-none",
				"prose-p:my-2 prose-li:my-0",
				"prose-headings:font-semibold prose-headings:tracking-tight",
				"prose-a:text-link prose-a:no-underline hover:prose-a:underline",
				"prose-code:rounded prose-code:border prose-code:border-border/60 prose-code:bg-bg-elev prose-code:px-1.5 prose-code:py-0.5 prose-code:text-accent prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
				"prose-pre:rounded-card prose-pre:border prose-pre:border-border/60 prose-pre:bg-bg-elev",
				"prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:not-italic prose-blockquote:text-fg/90",
				"prose-strong:text-fg prose-em:text-fg/95",
				"prose-hr:border-border/60",
			)}
		>
			{text}
		</Streamdown>
	);
}
