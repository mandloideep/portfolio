import { useEffect, useMemo, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { cn } from "#/lib/utils";

/**
 * Single action shown in a `CommandPaletteDialog`. The `perform` callback is
 * fired when the user picks the row (Enter or click). `group` is an optional
 * section header rendered above the first row in its group.
 */
export type PaletteAction = {
	id: string;
	label: string;
	hint?: string;
	group?: string;
	perform: () => void | Promise<void>;
	keywords?: string[];
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	actions: PaletteAction[];
	placeholder?: string;
	emptyMessage?: string;
};

/**
 * Generic fuzzy-filtered command palette. The terminal and portfolio both
 * mount this with their own action lists; the dialog handles search,
 * arrow-key navigation, and Enter-to-pick.
 *
 * Score order: label name-prefix > label substring > keyword/hint substring.
 */
export function CommandPaletteDialog({
	open,
	onOpenChange,
	actions,
	placeholder = "run command…",
	emptyMessage = "no matches",
}: Props) {
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

	useEffect(() => {
		if (open) {
			setQuery("");
			setActive(0);
			const t = setTimeout(() => inputRef.current?.focus(), 0);
			return () => clearTimeout(t);
		}
	}, [open]);

	const filtered = useMemo(() => filterActions(actions, query), [actions, query]);

	// Keep the active row inside the scroll viewport. `block: "nearest"`
	// only scrolls when the row is actually outside, so a row near the
	// middle of the list doesn't trigger a jitter.
	useEffect(() => {
		itemRefs.current[active]?.scrollIntoView({ block: "nearest" });
	}, [active]);

	function pick(action: PaletteAction) {
		onOpenChange(false);
		void action.perform();
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="bg-bg border-border p-0"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>command palette</DialogTitle>
					<DialogDescription>
						type to filter, enter to run
					</DialogDescription>
				</DialogHeader>
				<input
					ref={inputRef}
					data-testid="palette-input"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setActive(0);
					}}
					onKeyDown={(e) => {
						if (e.key === "ArrowDown") {
							e.preventDefault();
							setActive((a) => Math.min(filtered.length - 1, a + 1));
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							setActive((a) => Math.max(0, a - 1));
						} else if (e.key === "Enter") {
							e.preventDefault();
							const chosen = filtered[active];
							if (chosen) pick(chosen);
						}
					}}
					placeholder={placeholder}
					className="w-full bg-transparent px-4 py-3 text-fg outline-none border-b border-border font-mono text-sm placeholder:text-muted/70"
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={false}
				/>
				<ul
					data-testid="palette-list"
					className="max-h-72 overflow-y-auto py-1 font-mono text-sm"
				>
					{filtered.length === 0 ? (
						<li className="px-4 py-2 text-muted">{emptyMessage}</li>
					) : (
						renderGrouped(filtered, active, setActive, pick, itemRefs)
					)}
				</ul>
			</DialogContent>
		</Dialog>
	);
}

function renderGrouped(
	actions: PaletteAction[],
	active: number,
	setActive: (i: number) => void,
	pick: (a: PaletteAction) => void,
	itemRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>,
) {
	// Reset the slot array so stale refs from a previous filter pass don't
	// trip the scroll-into-view effect.
	itemRefs.current = new Array(actions.length).fill(null);
	const nodes: React.ReactNode[] = [];
	let lastGroup: string | undefined;
	actions.forEach((a, i) => {
		if (a.group && a.group !== lastGroup) {
			lastGroup = a.group;
			nodes.push(
				<li
					key={`group-${a.group}`}
					data-testid={`palette-group-${a.group}`}
					className="px-4 pt-3 pb-1 font-mono text-eyebrow uppercase tracking-tab text-muted/70"
				>
					{a.group}
				</li>,
			);
		}
		nodes.push(
			<li key={a.id}>
				<button
					ref={(el) => {
						itemRefs.current[i] = el;
					}}
					type="button"
					data-testid={`palette-item-${a.id}`}
					onClick={() => pick(a)}
					onMouseEnter={() => setActive(i)}
					className={cn(
						"flex w-full items-center justify-between gap-3 px-4 py-2 text-left",
						i === active ? "bg-border/50 text-fg" : "text-fg hover:bg-border/30",
					)}
				>
					<span className="truncate text-accent">{a.label}</span>
					{a.hint ? (
						<span className="shrink-0 truncate text-muted text-meta">
							{a.hint}
						</span>
					) : null}
				</button>
			</li>,
		);
	});
	return nodes;
}

function filterActions(actions: PaletteAction[], query: string): PaletteAction[] {
	const q = query.trim().toLowerCase();
	if (!q) return actions;
	return actions
		.map((a) => {
			const labelLc = a.label.toLowerCase();
			const hintLc = (a.hint ?? "").toLowerCase();
			const keywords = (a.keywords ?? []).map((k) => k.toLowerCase());
			let score = 0;
			if (labelLc.startsWith(q)) score += 3;
			else if (labelLc.includes(q)) score += 2;
			if (keywords.some((k) => k.startsWith(q))) score += 2;
			else if (keywords.some((k) => k.includes(q))) score += 1;
			if (hintLc.includes(q)) score += 1;
			return { a, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score)
		.map((x) => x.a);
}
