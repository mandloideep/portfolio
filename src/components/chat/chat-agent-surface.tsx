/**
 * <ChatAgentSurface> — chat-first conversational surface composed over
 * the same <AgentEngineProvider> the terminal uses. Two explicit variants
 * (no boolean prop): <ChatHero> in the empty state, <ChatThread> once
 * the conversation begins. Layout, header, and "new chat" affordance
 * live in <ChatLayout>.
 *
 * Wraps children in <ProjectPopupProvider> so any link the agent emits to
 * a known project URL opens the terminal-framed popup instead of leaving
 * the page.
 *
 * Mounted by `/chat`.
 */

import { useAgentSession } from "#/components/agent/agent-engine-provider";
import { ChatHero } from "./chat-hero";
import { ChatLayout } from "./chat-layout";
import { ChatThread } from "./chat-thread";
import { ProjectPopupProvider } from "./project-popup-provider";

export function ChatAgentSurface() {
	const { state } = useAgentSession();
	const isHero = state.history.length === 0;
	return (
		<ProjectPopupProvider>
			<ChatLayout>{isHero ? <ChatHero /> : <ChatThread />}</ChatLayout>
		</ProjectPopupProvider>
	);
}

// Compat re-export for old callsites that imported pickVariant from this module.
export { pickVariant } from "#/components/agent/rate-limit-notice";
