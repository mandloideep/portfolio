/**
 * Minimal structured logger. Outputs single-line JSON in production so log
 * aggregators (Dokploy → loki / vector / etc.) can index by level + fields;
 * pretty-prints in development for human readability.
 *
 * Kept zero-dependency on purpose — the surface is small enough that swapping
 * to pino later is a one-import change.
 */

type Level = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";

function serializeError(value: unknown): unknown {
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
		};
	}
	return value;
}

function emit(level: Level, arg1: unknown, arg2?: unknown): void {
	const [fields, message] =
		typeof arg1 === "string"
			? [undefined, arg1]
			: [arg1 as LogFields | undefined, (arg2 as string | undefined) ?? ""];

	const payload: Record<string, unknown> = {
		level,
		time: new Date().toISOString(),
		msg: message,
	};
	if (fields) {
		for (const [k, v] of Object.entries(fields)) {
			payload[k] = k === "err" ? serializeError(v) : v;
		}
	}

	const line = isProd
		? JSON.stringify(payload)
		: `[${level}] ${message}${fields ? ` ${JSON.stringify(fields)}` : ""}`;

	const sink = level === "error" ? console.error : console.warn;
	if (level === "info" || level === "debug") {
		console.log(line);
	} else {
		sink(line);
	}
}

export const logger = {
	debug: (arg1: unknown, arg2?: unknown) => emit("debug", arg1, arg2),
	info: (arg1: unknown, arg2?: unknown) => emit("info", arg1, arg2),
	warn: (arg1: unknown, arg2?: unknown) => emit("warn", arg1, arg2),
	error: (arg1: unknown, arg2?: unknown) => emit("error", arg1, arg2),
};
