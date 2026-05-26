import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { AgentEngineProvider } from "#/components/agent/agent-engine-provider";
import { ChatAgentSurface } from "#/components/chat/chat-agent-surface";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

const CHAT_TITLE = `${siteMeta.name} — chat (preview)`;
const CHAT_DESCRIPTION =
	"Preview of the chat surface for Deep's portfolio agent. Shares the engine, model switcher, and quota with the terminal.";

const SearchSchema = z.object({
	preview: z.coerce.number().int().optional(),
});

export const Route = createFileRoute("/chat")({
	validateSearch: (s) => SearchSchema.parse(s),
	component: ChatRoute,
	head: () => ({
		meta: [
			{ title: CHAT_TITLE },
			{ name: "description", content: CHAT_DESCRIPTION },
			{ name: "robots", content: "noindex" },
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
	const { preview } = useSearch({ from: "/chat" });
	if (preview !== 1) {
		return <PreviewGate />;
	}
	return (
		<AgentEngineProvider>
			<ChatAgentSurface />
		</AgentEngineProvider>
	);
}

function PreviewGate() {
	return (
		<div className="surface-grain min-h-screen bg-bg p-8 text-fg">
			<div className="mx-auto max-w-md rounded-card border border-border bg-bg-elev p-6 font-mono text-sm text-muted">
				<p className="mb-2 uppercase tracking-tab text-meta">chat · preview</p>
				<p className="text-fg/90">
					The chat surface is a work-in-progress preview that shares the engine
					with the{" "}
					<a className="text-accent" href="/terminal">
						terminal
					</a>
					.
				</p>
				<p className="mt-2">
					Open with <code className="text-accent">?preview=1</code> to try the
					scaffold. Aesthetic direction is being finalized.
				</p>
			</div>
		</div>
	);
}
