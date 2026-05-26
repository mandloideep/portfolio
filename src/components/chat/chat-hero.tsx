/**
 * <ChatHero> — empty-state hero for the chat surface.
 *
 * House-style terminal aesthetic: mono `$` caption + large greeting + a
 * focal typewriter role line with a visible caret + input pill + prompt
 * cards. No background atmosphere, no watermark, no avatar — matches the
 * rest of the portfolio (`/`, `/terminal`, `/projects`).
 */

import { siteMeta } from "#/content/site";
import { ChatInputPill } from "./chat-input-pill";
import { QuickPromptCards } from "./quick-prompts";
import { Typewriter } from "./typewriter";

const HERO_ROLES: ReadonlyArray<string> = [
	"AI engineer",
	"Full-stack builder",
	"Open-source contributor",
	"Curious researcher",
];

export function ChatHero() {
	const firstName = siteMeta.name.split(" ")[0];
	return (
		<section
			data-testid="chat-hero"
			className="relative flex flex-1 flex-col items-center px-6 pt-6 pb-12 sm:pt-10"
		>
			<div className="flex w-full flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
				<div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
					<p className="flex items-center gap-2 font-mono text-meta uppercase tracking-tab text-muted">
						<span aria-hidden="true" className="text-prompt-user">
							$
						</span>
						<span>cat ~/whoami</span>
					</p>
					<p className="font-display text-2xl font-medium text-fg">
						Hey, I'm {firstName} <span aria-hidden="true">👋</span>
					</p>
					<h1 className="font-display text-display font-medium leading-tight tracking-tight text-fg whitespace-nowrap">
						<Typewriter
							words={HERO_ROLES}
							respectReducedMotion={false}
							className="text-accent"
						/>
					</h1>
				</div>

				<div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">
					<ChatInputPill placeholder="Ask me anything…" showBeam focusOnMount />
				</div>

				<div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
					<QuickPromptCards />
				</div>
			</div>
		</section>
	);
}
