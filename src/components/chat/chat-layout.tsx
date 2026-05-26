import type { ReactNode } from "react";
import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { ModelSwitcher } from "#/components/agent/model-switcher";
import { QuotaIndicator } from "#/components/agent/quota-indicator";

type ChatLayoutProps = {
	children: ReactNode;
};

/**
 * Shared shell for the chat surface: page background, header (model +
 * quota + optional "new chat" affordance), and a centered content column.
 * The actual hero / thread variants are rendered into `children`.
 */
export function ChatLayout({ children }: ChatLayoutProps) {
	return (
		<div className="surface-grain relative flex min-h-screen flex-col bg-bg text-fg">
			<ChatHeader />
			<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
				{children}
			</div>
		</div>
	);
}

function ChatHeader() {
	const { actions, state } = useAgentSession();
	const hasHistory = state.history.length > 0;
	return (
		<header className="flex items-center justify-between gap-3 border-b border-border/70 bg-bg-elev/80 px-6 py-3 font-mono text-meta uppercase tracking-tab text-muted backdrop-blur-sm">
			<div className="flex items-center gap-3">
				<a
					href="/?choose=1"
					className="rounded-chip border border-border/70 bg-bg/60 px-2 py-0.5 text-fg/90 transition-colors duration-base hover:border-accent/60 hover:text-accent"
				>
					chat
				</a>
				{hasHistory ? (
					<button
						type="button"
						data-testid="chat-new"
						onClick={() => actions.clear()}
						className="rounded-chip border border-transparent px-2 py-0.5 text-muted normal-case tracking-normal transition-colors duration-base hover:border-border/70 hover:text-fg focus-visible:border-border/70 focus-visible:text-fg focus-visible:outline-none"
					>
						new chat
					</button>
				) : null}
			</div>
			<div className="flex items-center gap-3">
				<ModelSwitcher variant="header" />
				<QuotaIndicator />
			</div>
		</header>
	);
}
