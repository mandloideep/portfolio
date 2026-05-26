/**
 * <ProjectPopupProvider> — owns a single project-detail Dialog mounted at the
 * chat surface root. Any descendant can call `useProjectPopup().open(slug)`
 * (e.g. <ProjectAwareLink> intercepting a known project URL in the agent
 * answer stream) and the same dialog opens with that project's content.
 *
 * Single owner keeps focus management + esc handling consistent and avoids
 * re-instantiating the radix overlay tree on every link.
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
