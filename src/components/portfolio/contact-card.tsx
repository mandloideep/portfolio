import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { siteMeta } from "#/content/site";
import { cn } from "#/lib/utils";

type RowProps = {
	label: string;
	href?: string;
	external?: boolean;
	onClick?: () => void;
	value: React.ReactNode;
	testId: string;
	highlighted?: boolean;
};

function ContactRow({
	label,
	href,
	external,
	onClick,
	value,
	testId,
	highlighted,
}: RowProps) {
	const externalAttrs = external
		? { target: "_blank" as const, rel: "noreferrer" }
		: undefined;
	const rowClass = cn(
		"flex items-center gap-6 rounded-md border bg-bg-elev/60 px-5 py-4 transition-colors",
		highlighted
			? "border-accent/70 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_30%,transparent)]"
			: "border-border/70 hover:border-border",
	);

	const labelEl = (
		<span className="w-24 shrink-0 font-mono text-[13.5px] text-muted">
			{label}
		</span>
	);
	const arrowEl = (
		<span aria-hidden="true" className="text-muted">
			→
		</span>
	);
	const valueEl = (
		<span className="flex-1 font-mono text-[13.5px] text-link">{value}</span>
	);

	if (href) {
		return (
			<a
				data-testid={testId}
				href={href}
				{...externalAttrs}
				className={cn(
					rowClass,
					"focus-visible:outline-none focus-visible:border-accent/70",
				)}
			>
				{labelEl}
				{arrowEl}
				{valueEl}
			</a>
		);
	}
	if (onClick) {
		return (
			<button
				type="button"
				data-testid={testId}
				onClick={onClick}
				className={cn(
					rowClass,
					"text-left focus-visible:outline-none focus-visible:border-accent/70",
				)}
			>
				{labelEl}
				{arrowEl}
				{valueEl}
			</button>
		);
	}
	return (
		<div className={rowClass} data-testid={testId}>
			{labelEl}
			{arrowEl}
			{valueEl}
		</div>
	);
}

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

	const github = siteMeta.links.github.replace(/^https?:\/\//, "");
	const linkedin = siteMeta.links.linkedin.replace(/^https?:\/\//, "");

	return (
		<div
			data-testid="contact-card"
			className="flex flex-col gap-3 rounded-xl border border-border/70 bg-bg-elev/40 p-3 sm:p-5"
		>
			<ContactRow
				testId="contact-github"
				label="github"
				href={siteMeta.links.github}
				external
				value={github.replace(/^github\.com\//, "")}
			/>
			<ContactRow
				testId="contact-linkedin"
				label="linkedin"
				href={siteMeta.links.linkedin}
				external
				highlighted
				value={linkedin.replace(/^(?:www\.)?linkedin\.com\/in\//, "")}
			/>
			<ContactRow
				testId="contact-email"
				label="email"
				href={`mailto:${siteMeta.email}`}
				value={siteMeta.email}
			/>
			<ContactRow
				testId="contact-resume"
				label="resume"
				href={siteMeta.links.resume}
				external
				value="view resume"
			/>
			<ContactRow
				testId="contact-terminal"
				label="terminal"
				onClick={() => navigate({ to: "/terminal" })}
				value={
					<span className="inline-flex items-center gap-2">
						open the agentic terminal
						<span className="rounded-sm border border-border/70 bg-bg/60 px-1.5 py-0.5 font-mono text-[10px] text-muted">
							press t
						</span>
					</span>
				}
			/>
		</div>
	);
}
