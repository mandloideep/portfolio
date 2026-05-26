/**
 * <ProjectPopup> — terminal-framed modal showing a project's agent-prose
 * markdown. Shared across chat, portfolio, and terminal surfaces — opened
 * via the `<ProjectPopupProvider>` mounted at each surface root.
 *
 * Frame = traffic-light dots + mono path bar; body = Streamdown'd markdown
 * from `src/content/agent/projects/<slug>.md`; footer = live/repo link
 * chips + expand toggle. There's no "full page" navigation — the popup is
 * the full reading experience, and the expand button lets it fill the
 * viewport when a visitor wants to read in depth.
 */

import { ExternalLink, Github, Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { getProjectBySlug, getProjectMarkdownSync } from "#/lib/project-links";
import { cn } from "#/lib/utils";

type ProjectPopupProps = {
	slug: string | null;
	open: boolean;
	onOpenChange: (next: boolean) => void;
};

const PROSE_CLASS = cn(
	"prose prose-sm max-w-none text-fg",
	"prose-p:my-2 prose-li:my-0.5",
	"prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-fg",
	"prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
	"prose-a:text-link prose-a:no-underline hover:prose-a:underline",
	"prose-code:rounded prose-code:border prose-code:border-border/60 prose-code:bg-bg/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-accent prose-code:font-mono prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
	"prose-pre:rounded-card prose-pre:border prose-pre:border-border/60 prose-pre:bg-bg/80",
	"prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:not-italic prose-blockquote:text-fg/90",
	"prose-strong:text-fg prose-hr:border-border/60",
);

export function ProjectPopup({ slug, open, onOpenChange }: ProjectPopupProps) {
	const project = slug ? getProjectBySlug(slug) : null;
	const markdown = slug ? getProjectMarkdownSync(slug) : null;
	const [expanded, setExpanded] = useState(false);

	// Reset to compact when the popup closes or the slug changes — visitors
	// don't expect "expanded" to be sticky across project changes.
	useEffect(() => {
		if (!open) setExpanded(false);
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"flex flex-col gap-0 overflow-hidden p-0 transition-[max-width,max-height] duration-base",
					expanded
						? "max-w-5xl sm:max-w-5xl h-[90vh] max-h-[90vh]"
						: "max-w-2xl sm:max-w-2xl max-h-[80vh]",
				)}
				showCloseButton={false}
				data-testid="project-popup"
				data-expanded={expanded ? "true" : "false"}
			>
				{/* Terminal title bar */}
				<div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-bg/60 px-3 py-2">
					<span className="flex items-center gap-1.5" aria-hidden="true">
						<span className="size-2.5 rounded-full bg-error/70" />
						<span className="size-2.5 rounded-full bg-accent-alt/70" />
						<span className="size-2.5 rounded-full bg-success/70" />
					</span>
					<span className="ml-2 truncate font-mono text-meta uppercase tracking-tab text-muted">
						deep@portfolio:~/projects/{slug ?? "?"}
					</span>
					<div className="ml-auto flex items-center gap-1">
						<button
							type="button"
							onClick={() => setExpanded((v) => !v)}
							aria-label={expanded ? "Collapse" : "Expand"}
							aria-pressed={expanded}
							data-testid="project-popup-expand"
							className="inline-flex size-7 items-center justify-center rounded-card text-muted transition-colors duration-base hover:bg-bg-elev hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{expanded ? (
								<Minimize2 className="size-3.5" aria-hidden="true" />
							) : (
								<Maximize2 className="size-3.5" aria-hidden="true" />
							)}
						</button>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							aria-label="Close"
							data-testid="project-popup-close"
							className="inline-flex size-7 items-center justify-center rounded-card text-muted transition-colors duration-base hover:bg-bg-elev hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<X className="size-3.5" aria-hidden="true" />
						</button>
					</div>
				</div>

				{/* Title block — visually styled, also wires DialogTitle/Description for a11y */}
				<div className="shrink-0 border-b border-border/60 px-5 py-4">
					<div className="flex items-baseline gap-2 font-mono text-meta uppercase tracking-tab text-muted">
						<span aria-hidden="true" className="text-prompt-user">
							$
						</span>
						<span>cat ~/projects/{slug}.md</span>
						{project ? (
							<span
								className={cn(
									"ml-auto rounded-chip border border-border/70 bg-bg/60 px-1.5 py-0.5 text-fg/90",
									project.status === "running" && "text-success",
									project.status === "wip" && "text-accent-alt",
									project.status === "archived" && "text-muted/70",
								)}
							>
								{project.status}
							</span>
						) : null}
					</div>
					<DialogTitle className="mt-1 text-xl">
						{project?.title ?? slug ?? "Project"}
					</DialogTitle>
					{project?.summary ? (
						<DialogDescription className="mt-1 text-sm text-fg/80">
							{project.summary}
						</DialogDescription>
					) : null}
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-5 py-4">
					{markdown ? (
						<div className={cn(PROSE_CLASS)}>
							<Streamdown mode="streaming" parseIncompleteMarkdown={false}>
								{markdown}
							</Streamdown>
						</div>
					) : (
						<p className="text-sm text-muted">
							No detail page available for this project yet.
						</p>
					)}
				</div>

				{/* Footer chips */}
				{project ? (
					<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border/60 bg-bg/40 px-5 py-3">
						{project.links.live ? (
							<a
								href={project.links.live}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-card border border-border/70 bg-bg/40 px-3 py-1 font-mono text-meta uppercase tracking-tab text-muted transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<ExternalLink className="size-3.5" aria-hidden="true" />
								open live
							</a>
						) : null}
						{project.links.repo ? (
							<a
								href={project.links.repo}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-card border border-border/70 bg-bg/40 px-3 py-1 font-mono text-meta uppercase tracking-tab text-muted transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<Github className="size-3.5" aria-hidden="true" />
								repo
							</a>
						) : null}
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
