import { siteMeta } from "#/content/site";
import type { Mode } from "#/lib/mode";

/**
 * Visual chooser UI. Pure presentation — wiring (router, localStorage) lives
 * in the route component. Kept here so it can be unit-tested without a
 * Router context.
 */
export function ModeChooser({ onPick }: { onPick: (m: Mode) => void }) {
	return (
		<main
			className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
			aria-labelledby="chooser-heading"
		>
			<div className="text-center max-w-xl">
				<p className="text-muted text-sm mb-2">
					<span className="text-accent">$</span> cat ~/whoami
				</p>
				<h1
					id="chooser-heading"
					className="text-3xl md:text-4xl font-medium tracking-tight"
				>
					{siteMeta.name}
				</h1>
				<p className="text-muted mt-2">{siteMeta.role}</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 w-full max-w-2xl">
				<button
					type="button"
					onClick={() => onPick("ui")}
					data-testid="pick-ui"
					className="group rounded-lg border border-border bg-bg/40 p-6 text-left transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					<div className="text-accent text-sm font-medium mb-2">
						[ /portfolio ]
					</div>
					<div className="text-fg font-medium mb-1">Browse the portfolio</div>
					<div className="text-muted text-sm">
						bento layout, projects, contact. magic ui polish.
					</div>
				</button>

				<button
					type="button"
					onClick={() => onPick("terminal")}
					data-testid="pick-terminal"
					className="group rounded-lg border border-border bg-bg/40 p-6 text-left transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				>
					<div className="text-accent text-sm font-medium mb-2">
						[ /terminal ]
					</div>
					<div className="text-fg font-medium mb-1">Open terminal</div>
					<div className="text-muted text-sm">
						claude-code-style agent. ask anything. /exit to drop to shell.
					</div>
				</button>
			</div>

			<p className="text-muted text-xs">
				your choice is remembered. visit{" "}
				<code className="text-link">/?choose=1</code> to switch.
			</p>
		</main>
	);
}
