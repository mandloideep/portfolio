import { useMemo } from "react";
import {
	CommandPaletteDialog,
	type PaletteAction,
} from "#/components/ui/command-palette";
import { commands } from "#/lib/terminal/commands";
import { useSubmit } from "./use-submit";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * Terminal command palette. Thin wrapper that maps the slash-command
 * registry into the shared `CommandPaletteDialog`. Picking an item submits
 * the command name back through the terminal's submit pipeline.
 */
export function CommandPalette({ open, onOpenChange }: Props) {
	const submit = useSubmit();
	const actions = useMemo<PaletteAction[]>(
		() =>
			commands
				.filter((c) => !c.hidden)
				.map((c) => ({
					id: c.name.replace(/^\//, ""),
					label: c.name,
					hint: c.description,
					perform: () => {
						void submit(c.name);
					},
				})),
		[submit],
	);

	return (
		<CommandPaletteDialog
			open={open}
			onOpenChange={onOpenChange}
			actions={actions}
			placeholder="run command…"
			emptyMessage="no commands match"
		/>
	);
}
