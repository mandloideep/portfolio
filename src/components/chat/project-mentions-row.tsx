/**
 * <ProjectMentionsRow> — chip row under each assistant bubble listing any
 * projects the agent mentioned in the turn. Clicking opens the same
 * terminal-framed popup as the answer-stream link override.
 *
 * Belt-and-suspenders: lets visitors preview projects even when the model
 * forgets to emit a real markdown link.
 */

import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import type { AgentTurn } from "#/components/agent/agent-engine-provider";
import { useProjectPopup } from "#/components/chat/project-popup-provider";
import { getProjectBySlug } from "#/lib/project-links";
import { detectProjectMentions } from "#/lib/project-mentions";
import { cn } from "#/lib/utils";

export function ProjectMentionsRow({
	turn,
	className,
}: {
	turn: AgentTurn;
	className?: string;
}) {
	const popup = useProjectPopup();
	const slugs = useMemo(
		() => detectProjectMentions(turn.content),
		[turn.content],
	);
	if (!popup || slugs.length === 0) return null;

	return (
		<div
			data-testid="project-mentions-row"
			className={cn("mt-3 flex flex-wrap items-center gap-2", className)}
		>
			<span className="font-mono text-meta uppercase tracking-tab text-muted/70">
				view:
			</span>
			{slugs.map((slug) => {
				const project = getProjectBySlug(slug);
				if (!project) return null;
				return (
					<button
						key={slug}
						type="button"
						data-project-slug={slug}
						aria-haspopup="dialog"
						onClick={() => popup.open(slug)}
						className="inline-flex items-center gap-1 rounded-pill border border-border/70 bg-bg-elev/60 px-2.5 py-1 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
					>
						{project.title}
						<ArrowUpRight className="size-3" aria-hidden="true" />
					</button>
				);
			})}
		</div>
	);
}
