import { useEffect, useMemo, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { commands } from "#/lib/terminal/commands";
import { cn } from "#/lib/utils";
import { useSubmit } from "./use-submit";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * Fuzzy-filtered list of slash commands. Picking one submits it as a line.
 * Score: name-prefix match > name substring > description substring.
 */
export function CommandPalette({ open, onOpenChange }: Props) {
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const submit = useSubmit();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			setQuery("");
			setActive(0);
			// Focus shortly after dialog mounts.
			const t = setTimeout(() => inputRef.current?.focus(), 0);
			return () => clearTimeout(t);
		}
	}, [open]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const visible = commands.filter((c) => !c.hidden);
		if (!q) return visible;
		return visible
			.map((c) => {
				const nameLc = c.name.toLowerCase();
				const descLc = c.description.toLowerCase();
				let score = 0;
				if (nameLc.startsWith(q) || nameLc.startsWith(`/${q}`)) score += 3;
				else if (nameLc.includes(q)) score += 2;
				else if (descLc.includes(q)) score += 1;
				return { c, score };
			})
			.filter((x) => x.score > 0)
			.sort((a, b) => b.score - a.score)
			.map((x) => x.c);
	}, [query]);

	function pick(name: string) {
		onOpenChange(false);
		void submit(name);
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
					<DialogDescription>type to filter, enter to run</DialogDescription>
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
							if (chosen) pick(chosen.name);
						}
					}}
					placeholder="run command…"
					className="w-full bg-transparent px-4 py-3 text-fg outline-none border-b border-border font-mono text-sm"
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
						<li className="px-4 py-2 text-muted">no commands match</li>
					) : (
						filtered.map((c, i) => (
							<li key={c.name}>
								<button
									type="button"
									data-testid={`palette-item-${c.name.slice(1)}`}
									onClick={() => pick(c.name)}
									onMouseEnter={() => setActive(i)}
									className={cn(
										"flex w-full items-center justify-between px-4 py-2 text-left",
										i === active
											? "bg-border/50 text-fg"
											: "text-fg hover:bg-border/30",
									)}
								>
									<span className="text-accent">{c.name}</span>
									<span className="text-muted text-xs">{c.description}</span>
								</button>
							</li>
						))
					)}
				</ul>
			</DialogContent>
		</Dialog>
	);
}
