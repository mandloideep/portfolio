/**
 * <AnswerStream> — leaf renderer for the live answer buffer.
 *
 * Subscribes to the engine's per-token emitter via `useSyncExternalStore`,
 * so a 500-token reply repaints only this leaf, not the entire surface.
 * For completed turns, pass `text` directly to render static history.
 *
 * Markdown rendering uses `streamdown` (already in the project for the
 * terminal markdown block). Anchors are routed through <ProjectAwareLink>
 * so links to known project URLs open the in-chat popup instead of
 * navigating out.
 */

import { useMemo, useSyncExternalStore } from "react";
import { Streamdown } from "streamdown";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { ProjectAwareLink } from "#/components/agent/project-aware-link";
import { cn } from "#/lib/utils";

const PROSE_CLASS = cn(
	"prose prose-sm max-w-none text-fg",
	"prose-p:my-2 prose-p:leading-relaxed prose-li:my-1",
	"prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-fg",
	"prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
	"prose-a:text-link prose-a:no-underline hover:prose-a:underline",
	"prose-code:rounded prose-code:border prose-code:border-border/60 prose-code:bg-bg-elev prose-code:px-1.5 prose-code:py-0.5 prose-code:text-accent prose-code:font-mono prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
	"prose-pre:rounded-card prose-pre:border prose-pre:border-border/60 prose-pre:bg-bg-elev prose-pre:p-4",
	"prose-blockquote:border-l-2 prose-blockquote:border-accent/60 prose-blockquote:pl-3 prose-blockquote:not-italic prose-blockquote:text-fg/85",
	"prose-strong:text-fg prose-em:text-fg/95",
	"prose-hr:border-border/60",
	"prose-ul:my-2 prose-ol:my-2",
);

const STREAMDOWN_COMPONENTS = { a: ProjectAwareLink } as const;

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
	const components = useMemo(() => STREAMDOWN_COMPONENTS, []);
	if (!text) return null;
	return (
		<div className={cn(PROSE_CLASS, "terminal-prose", className)}>
			<Streamdown
				mode="streaming"
				parseIncompleteMarkdown={true}
				components={components}
			>
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
	const components = useMemo(() => STREAMDOWN_COMPONENTS, []);
	if (!text) return null;
	return (
		<div className={cn(PROSE_CLASS, "terminal-prose", className)}>
			<Streamdown
				mode="streaming"
				parseIncompleteMarkdown={true}
				components={components}
			>
				{text}
			</Streamdown>
		</div>
	);
}
