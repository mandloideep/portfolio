import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

/**
 * Floating "desktop" app icon — sibling to `<DesktopTerminalIcon>` — that
 * links visitors to the chat surface from the portfolio page. Same shape
 * and motion as the terminal icon so the two read as paired affordances.
 */
export function DesktopChatIcon() {
	return (
		<Link
			to="/chat"
			data-testid="desktop-chat-icon"
			aria-label="Open chat"
			className="group fixed bottom-6 right-28 z-overlay hidden flex-col items-center gap-2 font-mono text-meta text-muted transition-transform duration-base hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-none md:flex"
		>
			<span className="flex size-12 items-center justify-center rounded-card border border-border/70 bg-bg-elev/90 text-accent shadow-card transition-[border-color,box-shadow] duration-base group-hover:border-accent/60 group-hover:shadow-glow-strong group-focus-visible:border-accent/60 group-focus-visible:shadow-glow-strong">
				<MessageSquare className="size-6" aria-hidden="true" />
			</span>
			<span className="rounded-chip border border-border/60 bg-bg/70 px-1.5 py-0.5 uppercase tracking-tab text-eyebrow">
				chat
			</span>
		</Link>
	);
}
