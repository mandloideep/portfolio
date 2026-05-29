import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "#/components/ui/card";
import { Pill } from "#/components/ui/pill";
import { siteMeta } from "#/content/site";

type RowProps = {
	label: string;
	href?: string;
	external?: boolean;
	onClick?: () => void;
	value: React.ReactNode;
	testId: string;
};

function ContactRow({
	label,
	href,
	external,
	onClick,
	value,
	testId,
}: RowProps) {
	const externalAttrs = external
		? { target: "_blank" as const, rel: "noreferrer" }
		: undefined;
	const inner = (
		<>
			<span className="w-24 shrink-0 font-mono text-base text-muted">
				{label}
			</span>
			<span aria-hidden="true" className="font-mono text-base text-muted">
				→
			</span>
			<span className="flex-1 font-mono text-base text-link">{value}</span>
		</>
	);

	const className = "flex items-center gap-6 px-5 py-4";

	if (href) {
		return (
			<Card
				as="a"
				interactive
				data-testid={testId}
				href={href}
				{...externalAttrs}
				className={className}
			>
				{inner}
			</Card>
		);
	}
	if (onClick) {
		return (
			<Card
				as="button"
				interactive
				type="button"
				data-testid={testId}
				onClick={onClick}
				className={`${className} text-left`}
			>
				{inner}
			</Card>
		);
	}
	return (
		<Card data-testid={testId} className={className}>
			{inner}
		</Card>
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
			className="flex flex-col gap-3 rounded-card border border-border/70 bg-bg-elev/40 p-3 sm:p-5"
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
					<span className="inline-flex items-center gap-2.5">
						open the agentic terminal
						<Pill size="xs" tone="muted">
							press t
						</Pill>
					</span>
				}
			/>
		</div>
	);
}
