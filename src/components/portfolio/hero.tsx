import { CommandPrompt } from "#/components/ui/command-prompt";
import { KVRow } from "#/components/ui/kv-row";
import { siteMeta } from "#/content/site";
import { cn } from "#/lib/utils";

/**
 * Profile card hero. Renders the prompt line above, then a bordered card
 * with name (white) + green nickname-in-parens, cyan role subtitle, a
 * 2-column key/value grid, and an italic accent quip at the bottom.
 */
export function Hero({ className }: { className?: string }) {
	const nickname = "Deep";
	const role = siteMeta.role;
	const meta: Array<{ label: string; value: React.ReactNode }> = [
		{
			label: "focus",
			value: "AI agents, full-stack systems, developer tooling",
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
		<div data-testid="hero" className={cn("flex flex-col gap-4", className)}>
			<CommandPrompt command="cat whoami" />

			<article className="rounded-xl border border-border/80 bg-bg-elev/60 px-6 py-7 sm:px-8 sm:py-8">
				<header className="flex flex-col gap-2">
					<h2
						data-testid="hero-name"
						className="font-mono text-[clamp(1.85rem,4.4vw,2.65rem)] font-semibold leading-[1.05] tracking-tight text-fg"
					>
						{siteMeta.name} <span className="text-accent">({nickname})</span>
					</h2>
					<a
						href={siteMeta.links.resume}
						target="_blank"
						rel="noreferrer"
						className="w-fit font-mono text-[1rem] text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline sm:text-[1.05rem]"
					>
						{role}
					</a>
				</header>

				<dl className="mt-5 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
					{meta.map((row) => (
						<KVRow key={row.label} label={row.label} value={row.value} />
					))}
				</dl>

				<hr className="my-5 border-border/60" />

				<p
					data-testid="hero-quip"
					className="font-mono text-[14px] italic text-accent"
				>
					“{siteMeta.quip}”
				</p>
			</article>
		</div>
	);
}
