import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently considered "active" — the topmost
 * section whose top is within ~100px of the viewport top. Used by the dock
 * nav to highlight the user's location on the page.
 */
export function useScrollSpy(ids: readonly string[]): string | null {
	const [active, setActive] = useState<string | null>(ids[0] ?? null);

	useEffect(() => {
		if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
			return;
		}

		const elements = ids
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);

		if (elements.length === 0) return;

		const visible = new Set<string>();

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = entry.target.id;
					if (entry.isIntersecting) {
						visible.add(id);
					} else {
						visible.delete(id);
					}
				}
				// Pick the first id (in document order) that's currently visible.
				const next = ids.find((id) => visible.has(id));
				if (next) setActive(next);
			},
			{ rootMargin: "-100px 0px -60% 0px", threshold: 0 },
		);

		for (const el of elements) observer.observe(el);
		return () => observer.disconnect();
	}, [ids]);

	return active;
}
