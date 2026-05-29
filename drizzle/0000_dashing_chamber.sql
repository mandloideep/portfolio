CREATE TABLE "agent_prompt_cache" (
	"prompt_hash" text PRIMARY KEY NOT NULL,
	"verdict" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_rate_limits" (
	"ip_hash" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"premium_count" integer DEFAULT 0 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"premium_window_start" timestamp with time zone,
	"last_request_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_seen_country" text,
	"first_seen_asn" text,
	"privacy_checked" boolean DEFAULT false NOT NULL,
	"blocked_reason" text
);
--> statement-breakpoint
CREATE TABLE "agent_usage_daily" (
	"day" date PRIMARY KEY NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_call_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
