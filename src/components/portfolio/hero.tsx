import { useEffect, useRef, useState } from "react";
import { siteMeta } from "#/content/site";
import { useMagnetic } from "#/hooks/use-magnetic";
import { useReducedMotion } from "#/hooks/use-reduced-motion";
import { cn } from "#/lib/utils";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { LocalTime } from "./local-time";
import { StatusPill } from "./status-pill";

function ShimmerName({ name }: { name: string }) {
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
			<span
				ref={ref}
				data-testid="hero-name"
				data-shimmer="false"
				className="text-fg"
			>
				{name}
			</span>
		);
	}

	return (
		<span ref={ref} data-testid="hero-name" data-shimmer="true">
			<AnimatedShinyText className="mx-0 max-w-none text-fg/90">
				{name}
			</AnimatedShinyText>
		</span>
	);
}

export function Hero({ className }: { className?: string }) {
	const projectsRef = useMagnetic<HTMLAnchorElement>();
	const terminalRef = useMagnetic<HTMLAnchorElement>();
	return (
		<div data-testid="hero" className={cn("flex flex-col gap-6", className)}>
			<div className="flex flex-col gap-3">
				<p className="text-muted text-sm">hey, I&apos;m</p>
				<h3 className="text-4xl md:text-5xl font-medium tracking-tight">
					<ShimmerName name={siteMeta.name} />
				</h3>
				<p className="text-fg/80 text-base md:text-lg">{siteMeta.role}</p>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<StatusPill status={siteMeta.status} />
				<LocalTime />
			</div>

			<div className="flex flex-wrap items-center gap-3 pt-2">
				<a
					ref={projectsRef}
					href="#projects"
					data-testid="hero-cta-projects"
					className="inline-flex items-center gap-2 rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					<span aria-hidden="true" className="text-accent">
						▸
					</span>
					View projects
				</a>
				<a
					ref={terminalRef}
					href="/terminal"
					data-testid="hero-cta-terminal"
					className="inline-flex items-center gap-2 rounded-md border border-border bg-bg/40 px-4 py-2 text-sm text-fg hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					<span aria-hidden="true" className="text-muted">
						$
					</span>
					Open terminal
				</a>
			</div>
		</div>
	);
}
