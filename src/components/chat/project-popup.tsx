/**
 * <ProjectPopup> — terminal-framed modal showing a project's agent-prose
 * markdown. Triggered by <ProjectAwareLink> when an answer's link matches a
 * known project URL.
 *
 * Frame = traffic-light dots + mono path bar; body = Streamdown'd markdown
 * from `src/content/agent/projects/<slug>.md`; footer = small chips for live
 * and repo links (so the original navigation intent is still one click away).
 */

import { ArrowUpRight, ExternalLink, Github } from "lucide-react";
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
				showCloseButton={false}
				data-testid="project-popup"
			>
				{/* Terminal title bar */}
				<div className="flex items-center gap-2 border-b border-border/70 bg-bg/60 px-3 py-2">
					<span className="flex items-center gap-1.5" aria-hidden="true">
						<span className="size-2.5 rounded-full bg-error/70" />
						<span className="size-2.5 rounded-full bg-accent-alt/70" />
						<span className="size-2.5 rounded-full bg-success/70" />
					</span>
					<span className="ml-2 truncate font-mono text-meta uppercase tracking-tab text-muted">
						deep@portfolio:~/projects/{slug ?? "?"}
					</span>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="ml-auto rounded-chip px-2 py-0.5 font-mono text-meta uppercase tracking-tab text-muted/70 transition-colors hover:bg-bg-elev hover:text-fg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
						aria-label="Close"
					>
						esc
					</button>
				</div>

				{/* Title block — visually styled, also wires DialogTitle/Description for a11y */}
				<div className="border-b border-border/60 px-5 py-4">
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
				<div className="max-h-[60vh] overflow-y-auto px-5 py-4">
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
					<div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-bg/40 px-5 py-3">
						{project.links.live ? (
							<a
								href={project.links.live}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-pill border border-border/70 bg-bg-elev/60 px-3 py-1 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
								className="inline-flex items-center gap-1.5 rounded-pill border border-border/70 bg-bg-elev/60 px-3 py-1 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
							>
								<Github className="size-3.5" aria-hidden="true" />
								repo
							</a>
						) : null}
						<a
							href={`/projects#${slug}`}
							className="ml-auto inline-flex items-center gap-1 font-mono text-meta uppercase tracking-tab text-muted/80 transition-colors hover:text-accent"
						>
							full page
							<ArrowUpRight className="size-3.5" aria-hidden="true" />
						</a>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
