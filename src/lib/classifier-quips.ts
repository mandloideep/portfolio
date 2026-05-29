/**
 * Quips emitted as `activity` events while the classifier is running.
 * Visible to the user so they see the ~1s round-trip isn't silent.
 */
export const CHECKING_QUIPS = [
	"checking prompt…",
	"vibe checking…",
	"running through the gate…",
	"sniffing for jailbreaks…",
	"asking the bouncer…",
	"is this on topic…",
	"reading the room…",
	"running safety pass…",
	"validating intent…",
	"warming up the router…",
] as const;

export function pickCheckingQuip(): string {
	const i = Math.floor(Math.random() * CHECKING_QUIPS.length);
	return CHECKING_QUIPS[i] ?? "checking…";
}
