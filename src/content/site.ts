import { z } from "zod";

/**
 * Typed, Zod-validated UI constants. Imported directly by route components and
 * rendered into static HTML for SEO + fast paint.
 *
 * Schemas validate at module load; a malformed entry throws on import.
 *
 * The prose surface for the agent lives in `src/content/agent/**.md` — keep
 * the two in sync. `pnpm check-content` verifies the projects bijection.
 */

export const siteMeta = {
	name: "Deep Mandloi",
	role: "AI / Full-stack engineer",
	status: "Open to internships & SWE roles",
	email: "dmandloi@neiu.edu",
	location: "Chicago, IL",
	url: "https://deepmandloi.com",
	description:
		"Portfolio of Deep Mandloi: CS student, full-stack engineer, agent-tinkerer.",
	// Default OG card. Generated at build time by `scripts/generate-og.tsx`.
	// Per-route cards (/chat, /terminal, /github, projects/:slug) override
	// this via `buildOpenGraphMeta({ ogImage })`.
	ogImage: "/og/home.png",
	links: {
		github: "https://github.com/deepmandloi",
		linkedin: "https://linkedin.com/in/deepmandloi",
		resume: "/resume.pdf",
	},
	quip: "No bugs were harmed as of making this website.",
} as const;

export type SiteMeta = typeof siteMeta;

// ─── Projects ───────────────────────────────────────────────────────────

export const ProjectStatus = z.enum(["running", "complete", "wip", "archived"]);
export type ProjectStatusT = z.infer<typeof ProjectStatus>;

const StatCardSchema = z.object({
	value: z.string().min(1),
	label: z.string().min(1),
	sublabel: z.string().optional(),
	pulse: z.boolean().optional(),
});

export type ProjectStat = z.infer<typeof StatCardSchema>;

const ProjectSchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]+$/),
	title: z.string().min(1),
	status: ProjectStatus,
	summary: z.string().min(1),
	bullets: z.array(z.string()).min(1),
	tags: z.array(z.string()).min(1),
	links: z
		.object({
			live: z.string().url().optional(),
			repo: z.string().url().optional(),
			poster: z.string().url().optional(),
		})
		.default({}),
	featured: z.boolean().default(false),
	// Optional fields used only on the whoami page summary block:
	endpoint: z.string().optional(),
	cta: z.string().optional(),
	pitch: z.string().optional(),
	stats: z.array(StatCardSchema).optional(),
	meta: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const projects: Project[] = z.array(ProjectSchema).parse([
	{
		slug: "mydininghall",
		title: "mydininghall.com",
		status: "running",
		summary:
			"Multi-tenant campus dining platform with real-time menus and observability.",
		bullets: [
			"serves multiple universities from one stack",
			"celery + redis scrapers with fallback handling",
			"prometheus, grafana, loki observability",
			"cloudflare + nginx production config",
		],
		tags: ["Python", "Django", "React", "PostgreSQL", "Celery", "AWS"],
		links: { live: "https://mydininghall.com" },
		featured: true,
		endpoint: "curl -s mydininghall.com/api/stats",
		cta: "visit site",
		meta: "1.2k visitors/mo · 2 universities · up 200 days",
		pitch:
			"Multi-tenant campus dining platform with real-time menus, nutrition info, and dining hall hours. Started as a capstone, now serving multiple universities with full observability and a white-label architecture.",
		stats: [
			{
				value: "1.2k",
				label: "visitors",
				sublabel: "past 30 days",
				pulse: true,
			},
			{ value: "2", label: "universities", sublabel: "neiu + uic" },
			{
				value: "99.9%",
				label: "uptime",
				sublabel: "since aug 2024",
				pulse: true,
			},
		],
	},
	{
		slug: "findingfive",
		title: "FindingFive research platform",
		status: "complete",
		summary:
			"Behavioral-research SaaS where I shipped front-end features and instrumentation as a research engineer.",
		bullets: [
			"react features for study authoring",
			"postgres query work, faster builder loads",
			"event instrumentation for study analytics",
		],
		tags: ["React", "Django", "PostgreSQL", "TypeScript"],
		links: { live: "https://www.findingfive.com" },
		featured: true,
		endpoint: "cat findingfive/build-metrics.log",
		cta: "findingfive.com",
		meta: "1K+ MAU · faster builder loads",
		pitch:
			"Front-end features and instrumentation for a behavioral-research platform serving 1K+ monthly active users. Tuned a slow study-builder load path and added analytics-grade event instrumentation.",
		stats: [
			{ value: "~3x", label: "faster", sublabel: "study-builder load" },
			{ value: "1K+", label: "MAU", sublabel: "researchers using studies" },
			{
				value: "100%",
				label: "study events",
				sublabel: "covered by analytics",
			},
		],
	},
	{
		slug: "agent-portfolio",
		title: "deepmandloi.com",
		status: "wip",
		summary:
			"This site. Dual-mode portfolio: claude-code-style terminal agent or polished browser bento.",
		bullets: [
			"tanstack start, react 19, magic ui",
			"openrouter for the agent, plain http",
			"one repo, one deploy, two front doors",
		],
		tags: ["TanStack Start", "React", "OpenRouter", "Magic UI"],
		links: {
			repo: "https://github.com/deepmandloi/portfolio",
		},
		featured: true,
		endpoint: "git log --oneline origin/main | head -5",
		cta: "view repo",
		meta: "tanstack start · react 19 · openrouter",
		pitch:
			"Dual-mode portfolio: a Claude-code-style terminal agent or a polished browser experience. One repo, one deploy, two front doors — built on TanStack Start with OpenRouter via plain HTTP.",
		stats: [
			{ value: "525", label: "tests", sublabel: "passing in CI" },
			{ value: "7", label: "themes", sublabel: "registered" },
			{ value: "2", label: "front doors", sublabel: "terminal + portfolio" },
		],
	},
	{
		slug: "dining-scraper",
		title: "campus dining scraper",
		status: "archived",
		summary:
			"The open-source scraper kernel that grew into mydininghall — multi-source, retry-tolerant.",
		bullets: [
			"plugin-style adapters per university",
			"backoff + circuit breaker for flaky upstreams",
			"jsonl output, replayable on disk",
		],
		tags: ["Python", "asyncio", "PostgreSQL"],
		links: {
			repo: "https://github.com/deepmandloi/dining-scraper",
		},
		featured: false,
	},
]);

export function getProject(slug: string): Project | undefined {
	return projects.find((p) => p.slug === slug);
}

// ─── Experience ─────────────────────────────────────────────────────────

const ExperienceSchema = z.object({
	company: z.string().min(1),
	role: z.string().min(1),
	start: z.string().min(1),
	end: z.string().min(1),
	bullets: z.array(z.string()).min(1),
	tags: z.array(z.string()),
});

export type Experience = z.infer<typeof ExperienceSchema>;

export const experience: Experience[] = z.array(ExperienceSchema).parse([
	{
		company: "Northeastern Illinois University",
		role: "Undergraduate researcher & teaching assistant",
		start: "2024-08",
		end: "present",
		bullets: [
			"ta for intro cs and data-structures sections",
			"research on agent tool-use for campus services",
			"mentored students through their first projects",
		],
		tags: ["Teaching", "Research", "Python"],
	},
	{
		company: "FindingFive",
		role: "Research software intern",
		start: "2023-06",
		end: "2023-12",
		bullets: [
			"react features for the study-builder",
			"postgres query work cut a slow load by ~3x",
			"event instrumentation for study analytics",
		],
		tags: ["React", "Django", "PostgreSQL"],
	},
]);

// ─── Research ───────────────────────────────────────────────────────────

const TimelineStatus = z.enum(["done", "wip", "pending"]);
export type TimelineStatusT = z.infer<typeof TimelineStatus>;

const TimelineItemSchema = z.object({
	label: z.string().min(1),
	status: TimelineStatus,
	range: z.string().optional(),
});

export type TimelineItem = z.infer<typeof TimelineItemSchema>;

const ResearchSchema = z.object({
	slug: z.string().regex(/^[a-z0-9-]+$/),
	title: z.string().min(1),
	venue: z.string().min(1),
	year: z.number().int().gte(2000),
	abstract: z.string().min(1),
	tags: z.array(z.string()),
	links: z
		.object({
			github: z.string().url().optional(),
			poster: z.string().url().optional(),
		})
		.optional(),
	timeline: z.array(TimelineItemSchema).optional(),
});

export type Research = z.infer<typeof ResearchSchema>;

export const research: Research[] = z.array(ResearchSchema).parse([
	{
		slug: "agent-tooluse-campus",
		title: "Tool-use patterns for narrow-domain campus agents",
		venue: "NEIU undergraduate research symposium · Advisor: Prof. Jing Su",
		year: 2025,
		abstract:
			"How constrained tool surfaces and a small local-context corpus outperform open browsing for campus-facing agents. Built a testbed with multiple LLM backends and tool inventories to compare grounding strategies under real student queries.",
		tags: ["Agents", "LLM", "Tool-use", "OpenRouter", "Evals"],
		links: {
			github: "https://github.com/deepmandloi/agent-tooluse-campus",
		},
		timeline: [
			{ label: "Literature review", status: "done", range: "Sep 1 — Sep 22" },
			{
				label: "Testbed + tool inventory",
				status: "done",
				range: "Sep 23 — Oct 20",
			},
			{ label: "Experiments", status: "wip", range: "Oct 21 — Nov 30" },
			{
				label: "Write-up & symposium",
				status: "pending",
				range: "Dec 1 — Dec 12",
			},
		],
	},
	{
		slug: "menu-scraping-resilience",
		title: "Resilient menu scraping across heterogeneous dining APIs",
		venue: "Internal write-up · mydininghall.com",
		year: 2024,
		abstract:
			"Plugin adapter design plus circuit-breaker patterns to keep menus fresh across 10+ upstream vendors. Trade-off study between freshness, retry budget, and downstream cache coherence under real production load.",
		tags: ["Scraping", "Resilience", "Python", "Celery"],
	},
]);

// ─── Skills ─────────────────────────────────────────────────────────────

const SkillGroupSchema = z.object({
	group: z.string().min(1),
	items: z.array(z.string()).min(1),
});

export type SkillGroup = z.infer<typeof SkillGroupSchema>;

export const skills: SkillGroup[] = z.array(SkillGroupSchema).parse([
	{
		group: "Languages",
		items: ["TypeScript", "Python", "Go", "SQL", "Bash"],
	},
	{
		group: "Infra",
		items: ["Postgres", "Redis", "Docker", "AWS", "Cloudflare", "Nginx"],
	},
	{
		group: "AI",
		items: ["OpenRouter", "Anthropic", "OpenAI", "RAG", "Tool-use", "Evals"],
	},
	{
		group: "Sports",
		items: ["Cricket", "Tennis", "Long-distance running"],
	},
	{
		group: "Fun",
		items: ["Mechanical keyboards", "Trail photography", "Lo-fi production"],
	},
]);
