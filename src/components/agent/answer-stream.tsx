/**
 * <AnswerStream> — leaf renderer for the live answer buffer.
 *
 * Subscribes to the engine's per-token emitter via `useSyncExternalStore`,
 * so a 500-token reply repaints only this leaf, not the entire surface.
 * For completed turns, pass `text` directly to render static history.
 *
 * Markdown rendering uses `streamdown` (already in the project for the
 * terminal markdown block). We re-export through a thin wrapper so both
 * surfaces stay consistent and a future swap is a single edit.
 */

import { useSyncExternalStore } from "react";
import { Streamdown } from "streamdown";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { cn } from "#/lib/utils";

const PROSE_CLASS = cn(
	"prose prose-sm max-w-none text-fg",
	"prose-p:my-2 prose-li:my-0",
	"prose-headings:font-semibold prose-headings:tracking-tight",
	"prose-a:text-link prose-a:no-underline hover:prose-a:underline",
	"prose-code:rounded prose-code:border prose-code:border-border/60 prose-code:bg-bg-elev prose-code:px-1.5 prose-code:py-0.5 prose-code:text-accent prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
	"prose-pre:rounded-card prose-pre:border prose-pre:border-border/60 prose-pre:bg-bg-elev",
	"prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:not-italic prose-blockquote:text-fg/90",
	"prose-strong:text-fg prose-em:text-fg/95",
	"prose-hr:border-border/60",
);

/**
 * Live variant: subscribes to the engine's answer buffer and paints as it
 * grows. Renders nothing until the buffer is non-empty.
 */
export function AnswerStream({ className }: { className?: string }) {
	const { streams } = useAgentSession();
	const text = useSyncExternalStore(
		streams.subscribeAnswer,
		streams.getAnswer,
		() => "",
	);
	if (!text) return null;
	return (
		<div className={cn(PROSE_CLASS, "terminal-prose", className)}>
			<Streamdown mode="streaming" parseIncompleteMarkdown={true}>
				{text}
			</Streamdown>
		</div>
	);
}

/**
 * Static variant: renders completed turn text. Used by the chat surface's
 * history pass and by tests.
 */
export function AnswerStreamStatic({
	text,
	className,
}: {
	text: string;
	className?: string;
}) {
	if (!text) return null;
	return (
		<div className={cn(PROSE_CLASS, "terminal-prose", className)}>
			<Streamdown mode="streaming" parseIncompleteMarkdown={true}>
				{text}
			</Streamdown>
		</div>
	);
}
