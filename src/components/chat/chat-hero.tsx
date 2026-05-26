import { AnimatedGridPattern } from "#/components/ui/animated-grid-pattern";
import { siteMeta } from "#/content/site";
import { cn } from "#/lib/utils";
import { ChatInputPill } from "./chat-input-pill";
import { QuickPromptRow } from "./quick-prompts";
import { Typewriter } from "./typewriter";

const HERO_ROLES: ReadonlyArray<string> = [
	"AI engineer",
	"Full-stack builder",
	"Open-source contributor",
	"Curious researcher",
];

/**
 * Empty-state hero for the chat surface. Animated terminal-style
 * typewriter under a greeting, centered input pill with a focus beam, and
 * a six-button quick-prompt row that pre-fills natural-language prompts.
 *
 * Composition + motion choreography per /frontend-design: one orchestrated
 * entrance instead of scattered micro-interactions. Tokens only.
 */
export function ChatHero() {
	return (
		<section
			data-testid="chat-hero"
			className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-6 py-12"
		>
			<AnimatedGridPattern
				numSquares={32}
				maxOpacity={0.06}
				duration={5}
				className={cn(
					"[mask-image:radial-gradient(520px_circle_at_center,white,transparent)]",
					"absolute inset-0 -z-10 text-accent",
				)}
			/>

			<div className="flex flex-col items-center gap-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
				<p className="flex items-center gap-2 font-mono text-meta uppercase tracking-tab text-muted">
					<span aria-hidden="true" className="text-prompt-user">
						$
					</span>
					<span>cat ~/whoami</span>
				</p>
				<h1 className="font-display text-display font-medium leading-tight tracking-tight text-fg">
					Hey, I'm {siteMeta.name.split(" ")[0]}.
				</h1>
				<div className="flex flex-wrap items-baseline justify-center gap-x-2 text-xl font-medium text-fg/85 sm:text-2xl">
					<span>I'm a</span>
					<Typewriter words={HERO_ROLES} className="text-accent" />
				</div>
			</div>

			<div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
				<ChatInputPill
					placeholder="Ask me anything about my work, projects, or experience…"
					showBeam
					focusOnMount
				/>
			</div>

			<div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
				<QuickPromptRow />
			</div>

			<p className="font-mono text-meta uppercase tracking-tab text-muted/80">
				six quick prompts · streaming answers · same model + quota as the{" "}
				<a href="/terminal" className="text-link hover:text-accent">
					terminal
				</a>
			</p>
		</section>
	);
}
