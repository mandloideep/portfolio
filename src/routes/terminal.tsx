import { createFileRoute } from "@tanstack/react-router";
import { TerminalShell } from "#/components/terminal/terminal-shell";
import { siteMeta } from "#/content/site";
import { buildOpenGraphMeta } from "#/lib/seo";

export const TERMINAL_TITLE = `${siteMeta.name} — terminal`;
export const TERMINAL_DESCRIPTION =
	"Interactive terminal portfolio: chat with my agent or browse projects via shell commands.";

export const Route = createFileRoute("/terminal")({
	component: TerminalShell,
	head: () => ({
		meta: [
			{ title: TERMINAL_TITLE },
			{ name: "description", content: TERMINAL_DESCRIPTION },
			...buildOpenGraphMeta({
				title: TERMINAL_TITLE,
				description: TERMINAL_DESCRIPTION,
				path: "/terminal",
				siteMeta,
			}),
		],
	}),
});
