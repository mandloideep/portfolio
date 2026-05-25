import { siteMeta } from "#/content/site";
import type { Mode } from "#/lib/mode";
import { Card } from "./ui/card";
import { Eyebrow } from "./ui/eyebrow";
import { RuleAccent } from "./ui/rule-accent";

/**
 * Mode chooser. Pure presentation — wiring (router, localStorage) lives
 * in the route. Two preview cards under a tight identity block, both in
 * the unified token system.
 */
export function ModeChooser({ onPick }: { onPick: (m: Mode) => void }) {
	return (
		<main
			data-page="chooser"
			className="surface-grain relative flex min-h-screen flex-col items-center justify-center gap-12 bg-bg px-6 py-16"
			aria-labelledby="chooser-heading"
		>
			<div className="flex max-w-2xl flex-col items-center gap-3 text-center">
				<Eyebrow as="p" className="flex items-center gap-2">
					<span aria-hidden="true" className="text-prompt-user">
						$
					</span>
					<span>cat ~/whoami</span>
				</Eyebrow>
				<h1
					id="chooser-heading"
					className="font-display text-display font-medium leading-tight tracking-tight"
				>
					{siteMeta.name}
				</h1>
				<RuleAccent variant="solid" className="max-w-[6rem]" />
				<p className="text-md text-fg/85">{siteMeta.role}</p>
			</div>

			<div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
				<ChoiceCard
					testId="pick-ui"
					onPick={() => onPick("ui")}
					tag="/portfolio"
					title="Browse the portfolio"
					description="profile card, projects, experience, research, contact — terminal-themed pages with the full bento spread."
					preview={<PortfolioPreview />}
				/>
				<ChoiceCard
					testId="pick-terminal"
					onPick={() => onPick("terminal")}
					tag="/terminal"
					title="Open terminal"
					description="agentic CLI. ask anything about Deep, /help to list commands, /exit drops to a shell."
					preview={<TerminalPreview />}
				/>
			</div>

			<p className="font-mono text-meta uppercase tracking-tab text-muted">
				your choice is remembered. visit{" "}
				<code className="normal-case tracking-normal text-link">
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
		<Card
			as="button"
			interactive
			type="button"
			onClick={onPick}
			data-testid={testId}
			className="group flex flex-col gap-5 p-6 transition-transform duration-base hover:-translate-y-0.5"
		>
			<div className="overflow-hidden rounded-md border border-border/70 bg-bg p-4 transition-colors duration-base group-hover:border-accent/40">
				{preview}
			</div>
			<div className="flex items-center justify-between gap-3">
				<Eyebrow className="text-accent">{tag}</Eyebrow>
				<span
					aria-hidden="true"
					className="font-mono text-meta uppercase tracking-tab text-muted opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100"
				>
					enter →
				</span>
			</div>
			<div className="flex flex-col gap-2">
				<div className="font-mono text-xl font-semibold leading-tight tracking-tight text-fg">
					{title}
				</div>
				<div className="text-base leading-snug text-fg/80">{description}</div>
			</div>
		</Card>
	);
}

function TerminalPreview() {
	return (
		<div className="flex flex-col gap-1.5 font-mono text-meta leading-snug">
			<div className="flex items-center gap-1.5 pb-1.5">
				<span className="size-2 rounded-pill bg-error/80" aria-hidden="true" />
				<span
					className="size-2 rounded-pill bg-accent-alt/70"
					aria-hidden="true"
				/>
				<span
					className="size-2 rounded-pill bg-success/80"
					aria-hidden="true"
				/>
			</div>
			<div>
				<span className="text-prompt-user">deep</span>
				<span className="text-prompt-symbol">@</span>
				<span className="text-prompt-host">portfolio</span>
				<span className="text-prompt-symbol">:~ $</span>{" "}
				<span className="text-prompt-cmd">whoami</span>
			</div>
			<div className="text-fg/80">deep@portfolio</div>
			<div>
				<span className="text-prompt-user">deep</span>
				<span className="text-prompt-symbol">@</span>
				<span className="text-prompt-host">portfolio</span>
				<span className="text-prompt-symbol">:~ $</span>{" "}
				<span className="text-prompt-cmd">cat ~/intro.md</span>
				<span className="caret-block ml-1" aria-hidden="true" />
			</div>
		</div>
	);
}

function PortfolioPreview() {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-1.5">
				<span className="rounded-sm border border-accent/60 bg-accent/10 px-1.5 py-px font-mono text-meta tracking-tab text-accent">
					[whoami]
				</span>
				<span className="rounded-sm border border-border/70 bg-bg-elev px-1.5 py-px font-mono text-meta text-muted">
					[/projects]
				</span>
				<span className="rounded-sm border border-border/70 bg-bg-elev px-1.5 py-px font-mono text-meta text-muted">
					[/contact]
				</span>
			</div>
			<div className="font-mono text-md font-semibold leading-tight tracking-tight text-fg">
				Selected work
			</div>
			<div className="grid grid-cols-3 gap-1.5">
				<div className="col-span-2 h-7 rounded-sm border border-border/70 bg-bg-elev" />
				<div className="h-7 rounded-sm border border-border/70 bg-bg-elev" />
				<div className="h-7 rounded-sm border border-border/70 bg-bg-elev" />
				<div className="h-7 rounded-sm border border-accent/60 bg-accent/15" />
				<div className="h-7 rounded-sm border border-border/70 bg-bg-elev" />
			</div>
		</div>
	);
}
