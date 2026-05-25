import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";

/**
 * Floating "desktop" app icon sitting in the corner of the portfolio
 * background. Click → /terminal. Mimics the macOS dock-icon look: small
 * square with rounded corners, soft elevation, accent ring on hover.
 * Hidden on small screens to avoid colliding with the frame.
 */
export function DesktopTerminalIcon() {
	return (
		<Link
			to="/terminal"
			data-testid="desktop-terminal-icon"
			aria-label="Open terminal"
			className="group fixed bottom-6 right-6 z-overlay hidden flex-col items-center gap-1.5 font-mono text-meta text-muted transition-transform duration-base hover:-translate-y-0.5 focus-visible:outline-none focus-visible:-translate-y-0.5 sm:flex"
		>
			<span className="flex size-12 items-center justify-center rounded-md border border-border/70 bg-bg-elev/90 text-accent shadow-card transition-[border-color,box-shadow] duration-base group-hover:border-accent/60 group-hover:shadow-glow-strong group-focus-visible:border-accent/60 group-focus-visible:shadow-glow-strong">
				<Terminal className="size-6" aria-hidden="true" />
			</span>
			<span className="opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100">
				terminal
			</span>
		</Link>
	);
}
