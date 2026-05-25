import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ModeChooser } from "#/components/mode-chooser";
import { PortfolioPage } from "#/components/portfolio/portfolio-page";
import { HiddenCorpus } from "#/components/seo/hidden-corpus";
import { siteMeta } from "#/content/site";
import { getStoredMode, type Mode, setStoredMode } from "#/lib/mode";
import { buildOpenGraphMeta } from "#/lib/seo";

const SearchSchema = z.object({
	choose: z.coerce.number().int().optional(),
	project: z.string().optional(),
});

export const INDEX_TITLE = `${siteMeta.name} — portfolio`;

export const Route = createFileRoute("/")({
	component: Home,
	validateSearch: SearchSchema,
	head: () => ({
		meta: [
			{ title: INDEX_TITLE },
			...buildOpenGraphMeta({
				title: INDEX_TITLE,
				description: siteMeta.description,
				path: "/",
				siteMeta,
			}),
		],
	}),
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

	return (
		<>
			{showChooser ? <ModeChooser onPick={pick} /> : <PortfolioPage />}
			<HiddenCorpus />
		</>
	);
}
