import {
	boolean,
	date,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
	id: serial().primaryKey(),
	title: text().notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

// Per-IP rate limiting + abuse metadata. Keyed by hashed IP so we never store
// raw addresses. `windowStart` rolls forward when the configured window
// elapses; `count` and `tokenCount` are the running totals inside the window.
export const agentRateLimits = pgTable("agent_rate_limits", {
	ipHash: text("ip_hash").primaryKey(),
	count: integer("count").notNull().default(0),
	tokenCount: integer("token_count").notNull().default(0),
	windowStart: timestamp("window_start", { withTimezone: true })
		.notNull()
		.defaultNow(),
	lastRequestAt: timestamp("last_request_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	firstSeenCountry: text("first_seen_country"),
	firstSeenAsn: text("first_seen_asn"),
	privacyChecked: boolean("privacy_checked").notNull().default(false),
	blockedReason: text("blocked_reason"),
});

// Global daily token budget. One row per UTC date — keeps the circuit
// breaker arithmetic dead simple.
export const agentUsageDaily = pgTable("agent_usage_daily", {
	day: date("day").primaryKey(),
	tokens: integer("tokens").notNull().default(0),
	requests: integer("requests").notNull().default(0),
});

// Cache for on-topic classifier verdicts. Hash of the lowercased trimmed
// prompt → SAFE/UNSAFE. Repeat questions are free after the first verdict.
export const agentPromptCache = pgTable("agent_prompt_cache", {
	promptHash: text("prompt_hash").primaryKey(),
	verdict: text("verdict").notNull(), // "SAFE" | "UNSAFE"
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
