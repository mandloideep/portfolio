import { useEffect, useRef, useState } from "react";
import { siteMeta } from "#/content/site";
import { useMagnetic } from "#/hooks/use-magnetic";
import { useReducedMotion } from "#/hooks/use-reduced-motion";
import { cn } from "#/lib/utils";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { Eyebrow } from "../ui/eyebrow";
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

type MetaRowProps = {
	label: string;
	value: string;
};

function MetaRow({ label, value }: MetaRowProps) {
	return (
		<div className="flex items-baseline gap-3 py-2.5 border-b border-border/60 last:border-b-0">
			<dt className="w-20 shrink-0">
				<Eyebrow className="text-muted/80">{label}</Eyebrow>
			</dt>
			<dd className="text-sm text-fg/90">{value}</dd>
		</div>
	);
}

export function Hero({ className }: { className?: string }) {
	const projectsRef = useMagnetic<HTMLAnchorElement>();
	const terminalRef = useMagnetic<HTMLAnchorElement>();
	const meta = [
		{ label: "location", value: siteMeta.location },
		{ label: "focus", value: "agents · systems · ui" },
		{ label: "email", value: siteMeta.email },
		{ label: "stack", value: "ts · python · postgres" },
	];

	return (
		<div
			data-testid="hero"
			className={cn(
				"grid grid-cols-1 gap-10 md:grid-cols-[1fr_minmax(0,16rem)] md:items-end",
				className,
			)}
		>
			<div className="flex flex-col gap-6">
				<Eyebrow as="p" className="flex items-center gap-2">
					<span aria-hidden="true" className="text-accent">
						$
					</span>
					<span>hey, I&apos;m</span>
				</Eyebrow>
				<h3 className="font-display text-[clamp(2.75rem,7vw,5.25rem)] font-medium leading-[0.95] tracking-tight">
					<ShimmerName name={siteMeta.name} />
				</h3>
				<p className="max-w-xl text-[1.0625rem] leading-[1.65] text-fg/90 md:text-lg">
					{siteMeta.role}
				</p>

				<div className="flex flex-wrap items-center gap-3 pt-2">
					<StatusPill status={siteMeta.status} />
					<LocalTime />
				</div>

				<div className="flex flex-wrap items-center gap-3 pt-3">
					<a
						ref={projectsRef}
						href="#projects"
						data-testid="hero-cta-projects"
						className="group inline-flex items-center gap-2 rounded-md border border-accent/70 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span
							aria-hidden="true"
							className="text-accent transition-transform group-hover:translate-x-0.5"
						>
							▸
						</span>
						View projects
					</a>
					<a
						ref={terminalRef}
						href="/terminal"
						data-testid="hero-cta-terminal"
						className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-elev/70 px-4 py-2.5 text-sm font-medium text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span aria-hidden="true" className="font-mono text-muted">
							$
						</span>
						Open terminal
					</a>
				</div>
			</div>

			<dl
				aria-label="profile metadata"
				className="rounded-md border border-border/70 bg-bg-elev/70 px-4 py-1"
			>
				{meta.map((row) => (
					<MetaRow key={row.label} label={row.label} value={row.value} />
				))}
			</dl>
		</div>
	);
}
