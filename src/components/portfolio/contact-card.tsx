import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { KVRow } from "#/components/ui/kv-row";
import { siteMeta } from "#/content/site";

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target instanceof HTMLInputElement) return true;
	if (target instanceof HTMLTextAreaElement) return true;
	return target.isContentEditable;
}

function dialogIsOpen(): boolean {
	if (typeof document === "undefined") return false;
	return document.querySelector('[role="dialog"][data-state="open"]') !== null;
}

export function ContactCard() {
	const navigate = useNavigate();

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key.toLowerCase() !== "t") return;
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.repeat) return;
			if (isEditableTarget(e.target)) return;
			if (dialogIsOpen()) return;
			e.preventDefault();
			navigate({ to: "/terminal" });
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [navigate]);

	const githubUrl = siteMeta.links.github;
	const linkedinUrl = siteMeta.links.linkedin;

	return (
		<div
			data-testid="contact-card"
			className="rounded-md border border-border/70 bg-bg-elev/50 px-5 py-4"
		>
			<dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
				<KVRow
					label="email"
					value={
						<a
							data-testid="contact-email"
							href={`mailto:${siteMeta.email}`}
							className="text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
						>
							{siteMeta.email}
						</a>
					}
				/>
				<KVRow
					label="github"
					value={
						<a
							data-testid="contact-github"
							href={githubUrl}
							target="_blank"
							rel="noreferrer"
							className="text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
						>
							{githubUrl.replace(/^https?:\/\//, "")}
						</a>
					}
				/>
				<KVRow
					label="linkedin"
					value={
						<a
							data-testid="contact-linkedin"
							href={linkedinUrl}
							target="_blank"
							rel="noreferrer"
							className="text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
						>
							{linkedinUrl.replace(/^https?:\/\//, "")}
						</a>
					}
				/>
				<KVRow
					label="terminal"
					value={
						<span className="inline-flex flex-wrap items-center gap-2">
							<button
								type="button"
								data-testid="contact-terminal"
								onClick={() => navigate({ to: "/terminal" })}
								className="text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
							>
								open the agentic terminal
							</button>
							<span className="rounded-sm border border-border/70 bg-bg/60 px-1.5 py-0.5 font-mono text-[10px] text-muted">
								press t
							</span>
						</span>
					}
				/>
			</dl>
		</div>
	);
}
