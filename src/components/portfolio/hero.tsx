import { AnimatedShinyText } from "#/components/ui/animated-shiny-text";
import { CommandPrompt } from "#/components/ui/command-prompt";
import { Divider } from "#/components/ui/divider";
import { StatusPill } from "#/components/ui/status-pill";
import { siteMeta } from "#/content/site";
import { useQuip } from "#/hooks/use-quip";
import { useReducedMotion } from "#/hooks/use-reduced-motion";
import { cn } from "#/lib/utils";

type MetaRow = { label: string; value: React.ReactNode };

/**
 * Profile card hero. Renders the `$ cat whoami` prompt above, then a
 * bordered card with name (white) + green nickname-in-parens, cyan role
 * subtitle, a 2-column key/value grid, and an italic accent quip with a
 * hairline separator above it. Sizes track the reference: ~36-42px name,
 * ~14-15px key/value rows.
 */
export function Hero({ className }: { className?: string }) {
	const nickname = "Deep";
	const reduced = useReducedMotion();
	const quip = useQuip();
	const meta: MetaRow[] = [
		{
			label: "focus",
			value: (
				<span className="text-accent">
					AI agents, full-stack systems, developer tooling
				</span>
			),
		},
		{
			label: "status",
			value: <span className="text-accent">{siteMeta.status}</span>,
		},
		{
			label: "location",
			value: <span className="text-link">{siteMeta.location}</span>,
		},
		{
			label: "open source",
			value: (
				<a
					href={siteMeta.links.github}
					target="_blank"
					rel="noreferrer"
					className="text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
				>
					github.com/deepmandloi
				</a>
			),
		},
	];

	return (
		<div data-testid="hero" className={cn("flex flex-col gap-5", className)}>
			<div className="flex flex-wrap items-center gap-3">
				<CommandPrompt command="cat whoami" />
				<StatusPill status={siteMeta.status} />
			</div>

			<article className="rounded-card border border-border/80 bg-bg-elev/60 px-7 py-8 sm:px-9 sm:py-9">
				<header className="flex flex-col gap-2">
					<h2
						data-testid="hero-name"
						className="font-mono text-display font-semibold leading-tight tracking-tight text-fg"
					>
						{siteMeta.name} <span className="text-accent">({nickname})</span>
					</h2>
					<a
						href={siteMeta.links.resume}
						target="_blank"
						rel="noreferrer"
						className="w-fit font-mono text-md text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline sm:text-lg"
					>
						{siteMeta.role}
					</a>
					<p
						data-testid="hero-tagline"
						className="font-mono text-sm italic text-muted"
					>
						{siteMeta.quip}
					</p>
				</header>

				<dl className="mt-7 grid grid-cols-1 gap-x-12 gap-y-2 sm:grid-cols-2">
					{meta.map((row) => (
						<div key={row.label} className="flex items-baseline gap-5 py-1.5">
							<dt className="w-28 shrink-0 font-mono text-sm text-muted">
								{row.label}:
							</dt>
							<dd className="flex-1 font-mono text-sm">{row.value}</dd>
						</div>
					))}
				</dl>

				<Divider className="my-7" />

				<p
					data-testid="hero-quip"
					className="font-mono text-base italic text-accent"
				>
					{reduced ? (
						`“${quip}”`
					) : (
						<AnimatedShinyText className="mx-0 max-w-none text-accent">
							{`“${quip}”`}
						</AnimatedShinyText>
					)}
				</p>
			</article>
		</div>
	);
}
