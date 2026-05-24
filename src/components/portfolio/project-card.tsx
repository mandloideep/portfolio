import { ExternalLink, Github } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Project, ProjectStatusT } from "#/content/site";
import { useReducedMotion } from "#/hooks/use-reduced-motion";
import { cn } from "#/lib/utils";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { Badge } from "../ui/badge";
import { MagicCard } from "../ui/magic-card";

const STATUS_VARIANT: Record<
	ProjectStatusT,
	"default" | "secondary" | "outline"
> = {
	running: "default",
	complete: "secondary",
	wip: "outline",
	archived: "outline",
};

const MEDIUM_TAG_LIMIT = 4;

export interface ProjectCardProps {
	project: Project;
	size: "hero" | "medium";
	onOpen: (slug: string) => void;
	className?: string;
}

function HeroTitle({ title }: { title: string }) {
	const reduced = useReducedMotion();
	const ref = useRef<HTMLSpanElement | null>(null);
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el || typeof IntersectionObserver === "undefined") return;
		const io = new IntersectionObserver((entries) => {
			const entry = entries[0];
			setInView(entry?.isIntersecting ?? false);
		});
		io.observe(el);
		return () => io.disconnect();
	}, []);

	if (reduced || !inView) {
		return (
			<span ref={ref} data-shimmer="false" className="text-fg">
				{title}
			</span>
		);
	}

	return (
		<span ref={ref} data-shimmer="true">
			<AnimatedShinyText className="mx-0 max-w-none text-fg/90">
				{title}
			</AnimatedShinyText>
		</span>
	);
}

export function ProjectCard({
	project,
	size,
	onOpen,
	className,
}: ProjectCardProps) {
	const isHero = size === "hero";
	const visibleTags = isHero
		? project.tags
		: project.tags.slice(0, MEDIUM_TAG_LIMIT);
	const hiddenTagCount = project.tags.length - visibleTags.length;

	return (
		<button
			type="button"
			data-testid={`project-card-${project.slug}`}
			data-size={size}
			onClick={() => onOpen(project.slug)}
			className={cn(
				"group block h-full w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
				className,
			)}
			aria-label={`Open details for ${project.title}`}
		>
			<MagicCard className="h-full rounded-xl">
				<div
					className={cn(
						"flex h-full flex-col gap-3 p-5",
						isHero ? "md:gap-4 md:p-6" : "gap-3",
					)}
				>
					<div className="flex items-start justify-between gap-3">
						<h3
							className={cn(
								"font-medium tracking-tight",
								isHero ? "text-2xl md:text-3xl" : "text-lg",
							)}
						>
							{isHero ? <HeroTitle title={project.title} /> : project.title}
						</h3>
						<Badge
							variant={STATUS_VARIANT[project.status]}
							data-testid={`project-status-${project.slug}`}
							className="shrink-0"
						>
							{project.status}
						</Badge>
					</div>

					<p
						className={cn(
							"text-fg/75",
							isHero
								? "text-sm md:text-base line-clamp-3"
								: "text-sm line-clamp-2",
						)}
					>
						{project.summary}
					</p>

					<div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
						{visibleTags.map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="border-border/70 text-fg/70"
							>
								{tag}
							</Badge>
						))}
						{hiddenTagCount > 0 ? (
							<span className="text-muted text-xs">+{hiddenTagCount}</span>
						) : null}
					</div>

					{(project.links.repo || project.links.live) && (
						<div
							className="flex items-center gap-3 pt-1"
							data-testid={`project-links-${project.slug}`}
						>
							{project.links.repo ? (
								<a
									href={project.links.repo}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									data-testid={`project-link-repo-${project.slug}`}
									className="inline-flex items-center gap-1.5 text-xs text-fg/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
									aria-label={`Open ${project.title} repository`}
								>
									<Github className="h-3.5 w-3.5" aria-hidden="true" />
									repo
								</a>
							) : null}
							{project.links.live ? (
								<a
									href={project.links.live}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									data-testid={`project-link-live-${project.slug}`}
									className="inline-flex items-center gap-1.5 text-xs text-fg/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
									aria-label={`Open ${project.title} live site`}
								>
									<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
									live
								</a>
							) : null}
						</div>
					)}
				</div>
			</MagicCard>
		</button>
	);
}
