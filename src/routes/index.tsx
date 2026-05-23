import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ModeChooser, UiStub } from "#/components/mode-chooser";
import { getStoredMode, type Mode, setStoredMode } from "#/lib/mode";

const SearchSchema = z.object({
	choose: z.coerce.number().int().optional(),
});

export const Route = createFileRoute("/")({
	component: Home,
	validateSearch: SearchSchema,
});

function Home() {
	const { choose } = Route.useSearch();
	const navigate = useNavigate();
	const [mode, setMode] = useState<Mode | null>(null);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setMode(getStoredMode(window.localStorage));
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (mode === "terminal" && !choose) {
			navigate({ to: "/terminal" });
		}
	}, [mode, choose, navigate]);

	function pick(next: Mode) {
		setStoredMode(window.localStorage, next);
		setMode(next);
		if (next === "terminal") {
			navigate({ to: "/terminal" });
		}
	}

	const showChooser =
		!hydrated || choose === 1 || mode === null || mode === "terminal";

	return showChooser ? <ModeChooser onPick={pick} /> : <UiStub />;
}
