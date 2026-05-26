/**
 * <ProjectPopupProvider> — owns a single project-detail Dialog mounted at a
 * surface root (chat, portfolio, terminal). Any descendant can call
 * `useProjectPopup().open(slug)` and the same dialog opens with that
 * project's content.
 *
 * Lives under `components/project/` (shared) rather than `components/chat/`
 * because the popup is now used across all three surfaces — chat agent
 * answers, portfolio project cards, and terminal project mentions.
 */

import { createContext, type ReactNode, use, useMemo, useState } from "react";
import { ProjectPopup } from "./project-popup";

type ProjectPopupContext = {
	open: (slug: string) => void;
	close: () => void;
	current: string | null;
};

const Ctx = createContext<ProjectPopupContext | null>(null);

export function ProjectPopupProvider({ children }: { children: ReactNode }) {
	const [current, setCurrent] = useState<string | null>(null);

	const value = useMemo<ProjectPopupContext>(
		() => ({
			open: (slug: string) => setCurrent(slug),
			close: () => setCurrent(null),
			current,
		}),
		[current],
	);

	return (
		<Ctx value={value}>
			{children}
			<ProjectPopup
				slug={current}
				open={current !== null}
				onOpenChange={(next) => {
					if (!next) setCurrent(null);
				}}
			/>
		</Ctx>
	);
}

export function useProjectPopup(): ProjectPopupContext | null {
	return use(Ctx);
}
