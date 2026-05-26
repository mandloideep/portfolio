import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
	CommandPaletteDialog,
	type PaletteAction,
} from "#/components/ui/command-palette";
import { siteMeta } from "#/content/site";
import { themes } from "#/content/themes";
import { useTheme } from "#/hooks/use-theme";
import { DENSITIES, setDensity } from "#/store/density";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const DENSITY_LABEL: Record<(typeof DENSITIES)[number], string> = {
	compact: "Compact (S)",
	cozy: "Cozy (M)",
	comfy: "Comfy (L)",
	roomy: "Roomy (XL)",
};

/**
 * Portfolio command palette. Curated, route-aware action list — picking an
 * item navigates, flips a theme, sets density, or opens an external link.
 * Backed by the shared `CommandPaletteDialog`.
 */
export function PortfolioPalette({ open, onOpenChange }: Props) {
	const navigate = useNavigate();
	const { theme, setTheme } = useTheme();

	const actions = useMemo<PaletteAction[]>(() => {
		const nav: PaletteAction[] = [
			{
				id: "go-home",
				group: "navigate",
				label: "Home",
				hint: "/",
				keywords: ["whoami", "hero", "about"],
				perform: () => navigate({ to: "/" }),
			},
			{
				id: "go-projects",
				group: "navigate",
				label: "Projects",
				hint: "/projects",
				keywords: ["work", "portfolio"],
				perform: () => navigate({ to: "/projects" }),
			},
			{
				id: "go-experience",
				group: "navigate",
				label: "Experience",
				hint: "/experience",
				keywords: ["work", "career", "roles"],
				perform: () => navigate({ to: "/experience" }),
			},
			{
				id: "go-research",
				group: "navigate",
				label: "Research",
				hint: "/research",
				keywords: ["papers", "publications"],
				perform: () => navigate({ to: "/research" }),
			},
			{
				id: "go-contact",
				group: "navigate",
				label: "Contact",
				hint: "/contact",
				keywords: ["email", "linkedin"],
				perform: () => navigate({ to: "/contact" }),
			},
		];

		const mode: PaletteAction[] = [
			{
				id: "open-terminal",
				group: "mode",
				label: "Open terminal",
				hint: "agent · CLI",
				keywords: ["terminal", "cli", "agent", "shell"],
				perform: () => navigate({ to: "/terminal" }),
			},
			{
				id: "pick-mode",
				group: "mode",
				label: "Pick mode again",
				hint: "/?choose=1",
				keywords: ["chooser", "switch"],
				perform: () => navigate({ to: "/", search: { choose: 1 } as never }),
			},
		];

		const themeActions: PaletteAction[] = themes.map((t) => ({
			id: `theme-${t.slug}`,
			group: "theme",
			label: `Theme · ${t.name}${t.slug === theme ? " (active)" : ""}`,
			hint: t.vibe,
			keywords: [t.slug, t.name, t.vibe],
			perform: () => setTheme(t.slug),
		}));

		const densityActions: PaletteAction[] = DENSITIES.map((d) => ({
			id: `density-${d}`,
			group: "density",
			label: DENSITY_LABEL[d],
			keywords: [d, "size", "zoom"],
			perform: () => setDensity(d),
		}));

		const external: PaletteAction[] = [
			{
				id: "open-github",
				group: "external",
				label: "Open GitHub",
				hint: siteMeta.links.github,
				keywords: ["github", "code", "repos"],
				perform: () => {
					window.open(siteMeta.links.github, "_blank", "noopener,noreferrer");
				},
			},
			{
				id: "open-resume",
				group: "external",
				label: "Open resume",
				hint: siteMeta.links.resume,
				keywords: ["cv", "pdf"],
				perform: () => {
					window.open(siteMeta.links.resume, "_blank", "noopener,noreferrer");
				},
			},
		];

		return [...nav, ...mode, ...themeActions, ...densityActions, ...external];
	}, [navigate, theme, setTheme]);

	return (
		<CommandPaletteDialog
			open={open}
			onOpenChange={onOpenChange}
			actions={actions}
			placeholder="navigate · pick theme · change density…"
			emptyMessage="no matches"
		/>
	);
}
