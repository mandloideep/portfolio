import { siteMeta } from "#/content/site";
import type { Mode } from "#/lib/mode";
import { Eyebrow } from "./ui/eyebrow";
import { RuleAccent } from "./ui/rule-accent";

/**
 * Visual chooser UI. Pure presentation — wiring (router, localStorage) lives
 * in the route component. Kept here so it can be unit-tested without a
 * Router context.
 *
 * Layout: a centered identity block, then two preview-style cards stacked on
 * mobile and side-by-side at sm+. Each card shows a mini-preview of what
 * picking it will land you in, framed in `bg-bg-elev` so the cards read as
 * surfaces above the page.
 */
export function ModeChooser({ onPick }: { onPick: (m: Mode) => void }) {
	return (
		<main
			data-page="chooser"
			className="surface-grain relative min-h-screen flex flex-col items-center justify-center gap-10 bg-bg px-6 py-16"
			aria-labelledby="chooser-heading"
		>
			<div className="flex max-w-xl flex-col items-center gap-3 text-center">
				<Eyebrow as="p" className="flex items-center gap-2">
					<span aria-hidden="true" className="text-accent">
						$
					</span>
					<span>cat ~/whoami</span>
				</Eyebrow>
				<h1
					id="chooser-heading"
					className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.02] tracking-tight"
				>
					{siteMeta.name}
				</h1>
				<RuleAccent variant="solid" className="max-w-[6rem]" />
				<p className="text-[0.95rem] text-fg/85">{siteMeta.role}</p>
			</div>

			<div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
				<ChoiceCard
					testId="pick-ui"
					onPick={() => onPick("ui")}
					tag="/portfolio"
					title="Browse the portfolio"
					description="bento layout, projects, experience timeline, contact."
					preview={<PortfolioPreview />}
				/>
				<ChoiceCard
					testId="pick-terminal"
					onPick={() => onPick("terminal")}
					tag="/terminal"
					title="Open terminal"
					description="agentic CLI. ask anything. /exit drops to shell."
					preview={<TerminalPreview />}
				/>
			</div>

			<p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
				your choice is remembered. visit{" "}
				<code className="text-link normal-case tracking-normal">
					/?choose=1
				</code>{" "}
				to switch.
			</p>
		</main>
	);
}

type ChoiceCardProps = {
	testId: string;
	onPick: () => void;
	tag: string;
	title: string;
	description: string;
	preview: React.ReactNode;
};

function ChoiceCard({
	testId,
	onPick,
	tag,
	title,
	description,
	preview,
}: ChoiceCardProps) {
	return (
		<button
			type="button"
			onClick={onPick}
			data-testid={testId}
			className="group flex flex-col gap-4 rounded-xl border border-border/80 bg-bg-elev p-5 text-left transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			<div className="overflow-hidden rounded-md border border-border/70 bg-bg p-3 transition-colors group-hover:border-accent/30">
				{preview}
			</div>
			<div className="flex items-center justify-between gap-3">
				<Eyebrow className="text-accent">{tag}</Eyebrow>
				<span
					aria-hidden="true"
					className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted opacity-0 transition-opacity group-hover:opacity-100"
				>
					enter →
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<div className="font-display text-[1.35rem] font-medium leading-[1.1] tracking-tight text-fg">
					{title}
				</div>
				<div className="text-sm leading-[1.55] text-fg/80">{description}</div>
			</div>
		</button>
	);
}

function TerminalPreview() {
	return (
		<div className="flex flex-col gap-1 font-mono text-[11px] leading-[1.55] text-fg/90">
			<div className="flex items-center gap-1.5 pb-1">
				<span
					className="size-1.5 rounded-full bg-error/80"
					aria-hidden="true"
				/>
				<span
					className="size-1.5 rounded-full bg-accent-alt/70"
					aria-hidden="true"
				/>
				<span
					className="size-1.5 rounded-full bg-success/80"
					aria-hidden="true"
				/>
			</div>
			<div>
				<span className="font-semibold text-accent">$</span>{" "}
				<span className="text-fg/95">whoami</span>
			</div>
			<div className="text-fg/80">deep@portfolio</div>
			<div>
				<span className="font-semibold text-accent">$</span>{" "}
				<span className="text-fg/95">cat ~/intro.md</span>
				<span className="caret-block ml-1" aria-hidden="true" />
			</div>
		</div>
	);
}

function PortfolioPreview() {
	return (
		<div className="flex flex-col gap-2.5">
			<div className="font-display text-lg font-medium leading-[1.05] tracking-tight text-fg">
				Selected work
			</div>
			<div className="grid grid-cols-3 gap-1">
				<div className="col-span-2 h-7 rounded-sm border border-border/70 bg-bg-elev" />
				<div className="h-7 rounded-sm border border-border/70 bg-bg-elev" />
				<div className="h-7 rounded-sm border border-border/70 bg-bg-elev" />
				<div className="h-7 rounded-sm border border-accent/60 bg-accent/15" />
				<div className="h-7 rounded-sm border border-border/70 bg-bg-elev" />
			</div>
		</div>
	);
}
