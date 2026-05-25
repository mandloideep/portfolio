import { Streamdown } from "streamdown";
import { cn } from "#/lib/utils";

/**
 * Renders a `markdown` block's text via streamdown.
 *
 * Streaming mode is used unconditionally so the same component covers both
 * "agent response that grows token-by-token" (Phase 6 SSE) and "static
 * corpus dump" (content commands). `parseIncompleteMarkdown` handles the
 * partial-fence case gracefully and is a no-op when the text is complete.
 */
export function MarkdownBlock({ text }: { text: string }) {
	return (
		<Streamdown
			mode="streaming"
			parseIncompleteMarkdown={true}
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
