/**
 * Quick-prompt surfaces — two explicit variants (composition-patterns:
 * patterns-explicit-variants):
 *
 *  - <QuickPromptCards>  — used by the chat hero. 5 soft cards, icon on top,
 *                          label below. Matches the Fastfolio home prompt row.
 *  - <QuickPromptPills>  — used inside the chat thread's sticky bottom block.
 *                          Mono uppercase pills, horizontal flex, wraps.
 *
 * Both consume the same `QUICK_PROMPTS` array and the same disabled/send
 * logic via `useQuickPromptSend()`. The hero's card variant renders the
 * first 5 to match the reference's 5-up grid; the thread shows all six.
 */

import {
	Briefcase,
	Layers,
	Mail,
	PartyPopper,
	User,
	Wrench,
} from "lucide-react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { Card } from "#/components/ui/card";
import { cn } from "#/lib/utils";

type QuickPrompt = {
	key: string;
	label: string;
	icon: typeof User;
	prompt: string;
	/** Tone class for the icon — keeps the hero cards visually distinct
	 *  without piling another token system on top. */
	iconClass: string;
};

export const QUICK_PROMPTS: ReadonlyArray<QuickPrompt> = [
	{
		key: "me",
		label: "Me",
		icon: User,
		prompt: "Who is Deep? Give me the quick rundown.",
		iconClass: "text-link",
	},
	{
		key: "projects",
		label: "Projects",
		icon: Wrench,
		prompt:
			"What projects has Deep shipped — and what's running in production today?",
		iconClass: "text-success",
	},
	{
		key: "skills",
		label: "Skills",
		icon: Layers,
		prompt: "What are Deep's strongest technical skills?",
		iconClass: "text-accent",
	},
	{
		key: "fun",
		label: "Fun",
		icon: PartyPopper,
		prompt: "Tell me something fun or unexpected about Deep.",
		iconClass: "text-accent-alt",
	},
	{
		key: "contact",
		label: "Contact",
		icon: Mail,
		prompt: "What's the best way to reach Deep?",
		iconClass: "text-link",
	},
	{
		key: "experience",
		label: "Experience",
		icon: Briefcase,
		prompt: "Walk me through Deep's work and research experience.",
		iconClass: "text-fg/80",
	},
];

function useQuickPromptSend() {
	const { actions, state } = useAgentSession();
	const disabled =
		state.status === "checking" ||
		state.status === "thinking" ||
		state.status === "answering";
	return {
		disabled,
		send: (text: string) => {
			if (disabled) return;
			void actions.send(text);
		},
	};
}

export function QuickPromptCards({ className }: { className?: string }) {
	const { disabled, send } = useQuickPromptSend();
	const items = QUICK_PROMPTS.slice(0, 5);
	return (
		<div
			data-testid="chat-quick-prompts"
			data-variant="cards"
			className={cn(
				"grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-5",
				className,
			)}
		>
			{items.map((p) => {
				const Icon = p.icon;
				return (
					<Card
						as="button"
						interactive
						type="button"
						key={p.key}
						disabled={disabled}
						data-testid={`chat-quick-${p.key}`}
						onClick={() => send(p.prompt)}
						className="group flex flex-col items-center justify-center gap-2 rounded-card border border-border/70 bg-bg-elev/70 px-3 py-4 text-fg/90 shadow-sm transition-all duration-base hover:-translate-y-0.5 hover:border-accent/50 hover:bg-bg-elev hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
					>
						<Icon
							className={cn(
								"size-5 transition-colors duration-base",
								p.iconClass,
							)}
							aria-hidden="true"
						/>
						<span className="text-sm font-medium">{p.label}</span>
					</Card>
				);
			})}
		</div>
	);
}

export function QuickPromptPills({ className }: { className?: string }) {
	const { disabled, send } = useQuickPromptSend();
	return (
		<div
			data-testid="chat-quick-prompts"
			data-variant="pills"
			className={cn(
				"flex flex-wrap items-center justify-center gap-2",
				className,
			)}
		>
			{QUICK_PROMPTS.map((p) => {
				const Icon = p.icon;
				return (
					<button
						key={p.key}
						type="button"
						disabled={disabled}
						data-testid={`chat-quick-${p.key}`}
						onClick={() => send(p.prompt)}
						className="inline-flex items-center gap-1 rounded-pill border border-border/70 bg-bg-elev/70 px-2.5 py-1 font-mono text-meta uppercase tracking-tab text-fg/90 transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/70 disabled:hover:text-fg/90"
					>
						<Icon className={cn("size-3", p.iconClass)} aria-hidden="true" />
						{p.label}
					</button>
				);
			})}
		</div>
	);
}

/**
 * Compat: old callsites imported `QuickPromptRow`. Default to the pill
 * variant so existing tests pointing at the data-testid still get something
 * meaningful. New code should import the variant directly.
 */
export const QuickPromptRow = QuickPromptPills;
