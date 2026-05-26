import { createFileRoute } from "@tanstack/react-router";
import { AgentEngineProvider } from "#/components/agent/agent-engine-provider";
import { ChatAgentSurface } from "#/components/chat/chat-agent-surface";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

const CHAT_TITLE = `${siteMeta.name} — chat`;
const CHAT_DESCRIPTION =
	"Chat with Deep's portfolio agent. Ask about projects, experience, skills, and more — shares the model switcher and quota with the terminal.";

export const Route = createFileRoute("/chat")({
	component: ChatRoute,
	head: () => ({
		meta: [
			{ title: CHAT_TITLE },
			{ name: "description", content: CHAT_DESCRIPTION },
			...buildOpenGraphMeta({
				title: CHAT_TITLE,
				description: CHAT_DESCRIPTION,
				path: "/chat",
				siteMeta,
			}),
		],
	}),
});

function ChatRoute() {
	return (
		<AgentEngineProvider>
			<ChatAgentSurface />
		</AgentEngineProvider>
	);
}
