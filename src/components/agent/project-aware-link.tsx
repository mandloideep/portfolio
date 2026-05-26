/**
 * <ProjectAwareLink> — Streamdown `<a>` replacement.
 *
 * If the link's href matches a known project URL, render a button that opens
 * the in-chat project popup. Otherwise behave as a normal external link.
 *
 * Used by <AnswerStream> (live + static) so links the agent emits like
 * `https://mydininghall.com` become previewable inline rather than yanking
 * the user out of the conversation.
 */

import { ArrowUpRight } from "lucide-react";
import type { AnchorHTMLAttributes } from "react";
import { useProjectPopup } from "#/components/chat/project-popup-provider";
import { resolveProjectFromHref } from "#/lib/project-links";
import { cn } from "#/lib/utils";

type Props = AnchorHTMLAttributes<HTMLAnchorElement>;

export function ProjectAwareLink({
	href,
	children,
	className,
	...rest
}: Props) {
	const popup = useProjectPopup();
	const slug = typeof href === "string" ? resolveProjectFromHref(href) : null;

	// Only intercept when a popup provider is mounted (chat surface). On
	// /terminal and other routes, links behave as normal external links.
	if (slug && popup) {
		return (
			<button
				type="button"
				data-project-slug={slug}
				aria-haspopup="dialog"
				onClick={() => popup.open(slug)}
				className={cn(
					"inline-flex items-baseline gap-0.5 text-link underline decoration-link/40 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm",
					className,
				)}
			>
				{children}
				<ArrowUpRight
					className="size-3 translate-y-px text-muted/70"
					aria-hidden="true"
				/>
			</button>
		);
	}

	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className={cn(
				"text-link no-underline hover:underline focus-visible:underline",
				className,
			)}
			{...rest}
		>
			{children}
		</a>
	);
}
