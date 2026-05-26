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
};

export const QUICK_PROMPTS: ReadonlyArray<QuickPrompt> = [
	{
		key: "me",
		label: "Me",
		icon: User,
		prompt:
			"Tell me about yourself — your background and what you're focused on right now.",
	},
	{
		key: "projects",
		label: "Projects",
		icon: Wrench,
		prompt: "What projects have you built? Walk me through the highlights.",
	},
	{
		key: "experience",
		label: "Experience",
		icon: Briefcase,
		prompt: "Walk me through your work and research experience.",
	},
	{
		key: "skills",
		label: "Skills",
		icon: Layers,
		prompt: "What are your strongest technical skills?",
	},
	{
		key: "fun",
		label: "Fun",
		icon: PartyPopper,
		prompt: "Tell me something fun or unexpected about yourself.",
	},
	{
		key: "contact",
		label: "Contact",
		icon: Mail,
		prompt: "How can I get in touch with you?",
	},
];

type QuickPromptRowProps = {
	className?: string;
};

export function QuickPromptRow({ className }: QuickPromptRowProps) {
	const { actions, state } = useAgentSession();
	const disabled =
		state.status === "checking" ||
		state.status === "thinking" ||
		state.status === "answering";
	return (
		<div
			data-testid="chat-quick-prompts"
			className={cn(
				"grid w-full max-w-2xl grid-cols-3 gap-2 sm:grid-cols-6",
				className,
			)}
		>
			{QUICK_PROMPTS.map((p) => (
				<QuickPromptButton
					key={p.key}
					prompt={p}
					disabled={disabled}
					onSend={() => actions.send(p.prompt)}
				/>
			))}
		</div>
	);
}

type QuickPromptButtonProps = {
	prompt: QuickPrompt;
	disabled: boolean;
	onSend: () => void;
};

function QuickPromptButton({
	prompt,
	disabled,
	onSend,
}: QuickPromptButtonProps) {
	const Icon = prompt.icon;
	return (
		<Card
			as="button"
			interactive
			type="button"
			disabled={disabled}
			data-testid={`chat-quick-${prompt.key}`}
			onClick={onSend}
			className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-card border-border/70 bg-bg-elev/60 p-2 text-fg/85 transition-all duration-base hover:-translate-y-0.5 hover:border-accent/50 hover:bg-bg-elev hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
		>
			<Icon
				className="size-4 text-muted transition-colors duration-base group-hover:text-accent"
				aria-hidden="true"
			/>
			<span className="font-mono text-meta uppercase tracking-tab">
				{prompt.label}
			</span>
		</Card>
	);
}
