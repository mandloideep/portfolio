/**
 * <ChatChip> — thin wrapper around the shared <ChromeButton> primitive
 * that preserves the chat header's compact rounded-card chip family
 * (M/L/XL group, model name, info button, brand chip).
 *
 * Kept as its own component for callsite ergonomics — the chat header
 * always wants `size="md"` + the `active` tone toggle — and to make a
 * future deprecation easy if every callsite migrates to ChromeButton
 * directly. Delegates everything to ChromeButton; no styling lives here.
 */

import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	ReactNode,
} from "react";
import { ChromeButton } from "#/components/ui/chrome-button";

type CommonProps = {
	children: ReactNode;
	className?: string;
	active?: boolean;
	tone?: "default" | "bare";
};

type ButtonProps = CommonProps &
	ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

type AnchorProps = CommonProps &
	AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a"; href: string };

type ChatChipProps = ButtonProps | AnchorProps;

export function ChatChip(props: ChatChipProps) {
	const { active, tone = "default", ...rest } = props;
	const chromeTone = tone === "bare" ? "bare" : active ? "accent" : "default";

	if (props.as === "a") {
		const { as: _as, ...anchorRest } = rest as AnchorProps;
		return (
			<ChromeButton
				size="md"
				tone={chromeTone}
				as="a"
				{...(anchorRest as AnchorHTMLAttributes<HTMLAnchorElement> & {
					href: string;
					children: ReactNode;
				})}
			/>
		);
	}
	const { as: _as, ...buttonRest } = rest as ButtonProps;
	return (
		<ChromeButton
			size="md"
			tone={chromeTone}
			{...(buttonRest as ButtonHTMLAttributes<HTMLButtonElement> & {
				children: ReactNode;
			})}
		/>
	);
}
