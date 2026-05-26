import { ExternalLink, Github } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Project, ProjectStatusT } from "#/content/site";
import { useMagnetic } from "#/hooks/use-magnetic";
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
	const magneticRef = useMagnetic<HTMLDivElement>();

	return (
		<div
			ref={magneticRef}
			data-testid={`project-card-${project.slug}`}
			data-size={size}
			className={cn("group relative h-full w-full rounded-card", className)}
		>
			<button
				type="button"
				data-testid={`project-card-open-${project.slug}`}
				onClick={() => onOpen(project.slug)}
				aria-label={`Open details for ${project.title}`}
				className="absolute inset-0 z-10 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			/>
			<MagicCard className="h-full rounded-card border-border/80">
				<div
					className={cn(
						"flex h-full flex-col gap-3 p-5",
						isHero ? "md:gap-4 md:p-6" : "gap-3",
					)}
				>
					<div className="flex items-start justify-between gap-3">
						<h3
							className={cn(
								"font-display font-medium leading-[1.05] tracking-tight",
								isHero
									? "text-[clamp(1.625rem,2.6vw,2.25rem)]"
									: "text-[1.35rem]",
							)}
						>
							{isHero ? <HeroTitle title={project.title} /> : project.title}
						</h3>
						<Badge
							variant={STATUS_VARIANT[project.status]}
							data-testid={`project-status-${project.slug}`}
							className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]"
						>
							{project.status}
						</Badge>
					</div>

					<p
						className={cn(
							"text-fg/85 leading-relaxed",
							isHero
								? "text-sm md:text-[0.95rem] line-clamp-3"
								: "text-sm line-clamp-2",
						)}
					>
						{project.summary}
					</p>

					<div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
						{visibleTags.map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="border-border/70 bg-bg/40 font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg/80"
							>
								{tag}
							</Badge>
						))}
						{hiddenTagCount > 0 ? (
							<span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
								+{hiddenTagCount}
							</span>
						) : null}
					</div>

					{(project.links.repo || project.links.live) && (
						<div
							className="relative z-20 flex items-center gap-3 pt-1"
							data-testid={`project-links-${project.slug}`}
						>
							{project.links.repo ? (
								<a
									href={project.links.repo}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									data-testid={`project-link-repo-${project.slug}`}
									className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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
									className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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
		</div>
	);
}
