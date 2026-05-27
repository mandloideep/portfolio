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

// ─── Section flags ──────────────────────────────────────────────────────
//
// Single source of truth for "which sections of this portfolio are
// publicly visible". Every surface that exposes a section (top tabs,
// mobile drawer, command palette, route handlers) reads from this
// registry, so flipping a flag here removes the section everywhere
// without touching component code.

export const SectionId = z.enum([
	"hero",
	"projects",
	"experience",
	"research",
	"github",
	"contact",
	"chat",
]);
export type SectionIdT = z.infer<typeof SectionId>;

export const sections: Record<SectionIdT, { enabled: boolean }> = {
	hero: { enabled: true },
	projects: { enabled: true },
	experience: { enabled: true },
	research: { enabled: false }, // data lives in research[] below; surface hidden until paper ships
	github: { enabled: true },
	contact: { enabled: true },
	chat: { enabled: true },
};

export function isSectionEnabled(id: SectionIdT): boolean {
	return sections[id]?.enabled ?? false;
}

// ─── Site meta ──────────────────────────────────────────────────────────

export const siteMeta = {
	name: "Deep Mandloi",
	role: "AI / Full-stack engineer · MS CS (NEIU '25)",
	status: "Open to new-grad SWE / AI engineering roles",
	email: "mandloideep22@gmail.com",
	location: "Chicago, IL",
	url: "https://deepmandloi.com",
	description:
		"Portfolio of Deep Mandloi: full-stack engineer, agent-tinkerer, and lifelong learner. I build projects that blend solid engineering with a touch of fun — check out my work and get in touch!",
	// Default OG card. Generated at build time by `scripts/generate-og.tsx`.
	// Per-route cards (/chat, /terminal, /github, projects/:slug) override
	// this via `buildOpenGraphMeta({ ogImage })`.
	ogImage: "/og/home.png",
	education: {
		degree: "MS in Computer Science",
		school: "Northeastern Illinois University",
		graduated: "2025-12",
	},
	links: {
		github: "https://github.com/mandloideep",
		linkedin: "https://linkedin.com/in/thedeepmandloi",
		resume: "/resume.pdf",
	},
	// TODO: confirm with Deep — current quip is the carry-over default.
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
		slug: "commentdraw",
		title: "CommentDraw",
		status: "running",
		summary:
			"Full-stack SaaS that picks fair winners from YouTube giveaway comments, with Stripe billing and a loyalty-weighted draw.",
		bullets: [
			"paginates the youtube data api and dedupes by channel id",
			"stripe checkout with signed webhook handling, test mode",
			"bucket4j + redis for distributed rate limiting",
			"event-driven email pipeline through brevo's rest api",
			"one vps, one cdn, runs on roughly five euros a month",
		],
		tags: [
			"Java 25",
			"Spring Boot 3.5",
			"React 19",
			"Stripe",
			"MySQL",
			"Docker",
		],
		links: { live: "https://commentdraw.deepmandloi.com" },
		featured: true,
		endpoint: "curl -s api-cw.deepmandloi.com/actuator/health",
		cta: "visit site",
		meta: "java 25 + spring boot · react 19 + rtk query · hetzner + cloudflare pages",
		pitch:
			"Deep built a tool that scrapes YouTube comments, dedupes by channel, and picks a winner in one click. Solo project, nine months, still online.",
		stats: [
			{
				value: "158",
				label: "commits",
				sublabel: "9 months solo",
				pulse: true,
			},
			{
				value: "22",
				label: "rest endpoints",
				sublabel: "5 controllers + stripe webhooks",
			},
			{ value: "13.8k", label: "loc", sublabel: "java + react, 266 files" },
		],
	},
	{
		slug: "atelier",
		title: "Atelier",
		status: "running",
		summary:
			"RAG chatbot for academic papers — LangGraph router, Qdrant vectors, Gemini default with OpenAI fallback.",
		bullets: [
			"router splits queries 3 ways before retrieval",
			"sqlite checkpointer per session — history survives restarts",
			"5 deepeval metrics graded at threshold 0.7",
			"per-ip daily cap + offline kill switch before going public",
			"one-click dokploy deploy from a ghcr image",
		],
		tags: ["Python", "LangGraph", "Qdrant", "Streamlit", "Gemini", "DeepEval"],
		links: { live: "https://atelier.deepmandloi.com" },
		featured: true,
		endpoint: "curl -s atelier.deepmandloi.com",
		cta: "visit site",
		meta: "langgraph · gemini · dokploy on hetzner",
		pitch:
			"A Streamlit app where you drop in a PDF, URL, or arXiv ID and ask questions grounded in the paper. A LangGraph router splits each query into retrieve, verify-claim, or direct-answer, and the whole thing runs publicly behind per-IP caps and a kill switch.",
		stats: [
			{ value: "3.0k", label: "python loc", sublabel: "across 17 modules" },
			{
				value: "5",
				label: "rag metrics",
				sublabel: "deepeval-graded @ 0.7",
			},
			{
				value: "live",
				label: "atelier.deepmandloi.com",
				sublabel: "dokploy on hetzner",
				pulse: true,
			},
		],
	},
	{
		slug: "workflow-builder",
		title: "Workflow Builder",
		status: "running",
		summary:
			"Small-scale n8n-style automation builder — a learning project to ship a real DAG executor end-to-end.",
		bullets: [
			"drag-and-drop canvas with topological execution",
			"refresh-token rotation with family revocation",
			"credentials encrypted at rest with fernet",
			"one-box deploy via dokploy + ghcr",
		],
		tags: [
			"FastAPI",
			"React",
			"ReactFlow",
			"SQLAlchemy",
			"TypeScript",
			"Postgres",
		],
		links: { live: "https://workflow.deepmandloi.com" },
		featured: true,
		endpoint: "curl -s workflow.deepmandloi.com/api/health",
		cta: "visit site",
		meta: "learning project · self-hosted · 18 api routes · 4 alembic migrations",
		pitch:
			"A small-scale n8n-style automation builder Deep wrote to learn how the real ones work. React Flow on the front, FastAPI async on the back, three integrations, one Hetzner box. Not aiming for n8n's complexity — aiming to understand it.",
		stats: [
			{
				value: "8.3k",
				label: "loc",
				sublabel: "typescript + python",
				pulse: true,
			},
			{
				value: "79",
				label: "components",
				sublabel: "react + reactflow surface",
			},
			{
				value: "4",
				label: "migrations",
				sublabel: "auth, tokens, encryption, schema",
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
		tags: ["TanStack Start", "React 19", "OpenRouter", "Magic UI"],
		links: {
			repo: "https://github.com/mandloideep/portfolio",
		},
		featured: true,
		endpoint: "git log --oneline origin/main | head -5",
		cta: "view repo",
		meta: "tanstack start · react 19 · openrouter",
		pitch:
			"Dual-mode portfolio: a Claude-code-style terminal agent or a polished browser experience. One repo, one deploy, two front doors — built on TanStack Start with OpenRouter via plain HTTP.",
		stats: [
			{ value: "590", label: "tests", sublabel: "passing in ci" },
			{ value: "7", label: "themes", sublabel: "registered" },
			{ value: "2", label: "front doors", sublabel: "terminal + portfolio" },
		],
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
	/** Optional 1–2 paragraph narrative for roles that carry a meaningful
	 *  project (e.g. the ACOSUS research framing). Renders below bullets in
	 *  the experience card when present. */
	narrative: z.string().optional(),
	/** Optional outbound links — used when an experience entry maps to a
	 *  shipped artifact (live site, repo, paper). */
	links: z
		.array(
			z.object({
				label: z.string().min(1),
				url: z.string().url(),
			}),
		)
		.optional(),
});

export type Experience = z.infer<typeof ExperienceSchema>;

export const experience: Experience[] = z.array(ExperienceSchema).parse([
	{
		company: "Northeastern Illinois University",
		role: "CS Instructor",
		start: "2026-01",
		end: "present",
		bullets: [
			"deliver cs300 (web development) to undergraduate cohorts, tailoring instruction to mixed skill levels",
			"author lab guides, setup instructions, and rubrics that produce reproducible learning outcomes",
			"troubleshoot student environment configuration across macos, windows, and linux",
		],
		tags: ["Teaching", "Web Development", "JavaScript"],
	},
	{
		company: "Northeastern Illinois University · ACOSUS",
		role: "AI Engineer / Research Assistant",
		start: "2024-04",
		end: "present",
		bullets: [
			"sole engineer across backend (73.4k loc typescript), frontend (102k loc react), and a flask knn model service (4.7k loc python)",
			"migrated a 7k-loc javascript codebase into a 130k-loc typescript platform with role-based dynamic surveys",
			"cut frontend load times ~50% via lazy loading and rtk query, and reduced data retrieval ~34% with schema + aggregation work",
			"wired github actions + docker ci/cd that cut release cycles ~40%",
			"replaced an overfitting tensorflow neural net with a knn + pwrs calibration pipeline once the cohort proved too small for stable nn training",
		],
		tags: [
			"TypeScript",
			"Node.js",
			"Express",
			"MongoDB",
			"React",
			"Flask",
			"scikit-learn",
			"Docker",
		],
		narrative:
			"acosus is a student-success research platform at neiu that surveys students, predicts who's likely to disengage, and gives advisors a dashboard to act on it. deep is the only engineer — every route, every model, every deploy. the api serves three audiences out of one express app (students, advisors, admins), talks to a separate flask service for the knn model, and has been in continuous development since may 2024. the live site is at acosus.neiu.edu and the work underpins an in-progress dsi paper on a progressive learning framework: knn first, then gan-augmented data, then a neural net trained on the augmented set.",
		links: [
			{ label: "live · acosus.neiu.edu", url: "https://acosus.neiu.edu/login" },
		],
	},
	{
		company: "Dokploy",
		role: "Open Source Contributor",
		start: "2025-08",
		end: "present",
		bullets: [
			"shipped a profile-picture upload system for the deployment-platform ui",
			"added api + cli metadata customization for user profiles",
			"fixed an ssh connection bug in the ip-address parsing logic",
		],
		tags: ["TypeScript", "Node.js", "Open Source", "Docker"],
		links: [{ label: "dokploy", url: "https://github.com/Dokploy/dokploy" }],
	},
	{
		company: "CodePath",
		role: "Peer Mentor",
		start: "2025-05",
		end: "2025-12",
		bullets: [
			"monthly 1:1 check-ins with first-time codepath students on study strategies, platform tools, and community resources",
			"coached mentees toward independent problem-solving — 83% reported increased confidence in completing their course",
		],
		tags: ["Mentoring", "Teaching"],
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

// These entries describe the ACOSUS work in detail. The /research surface
// is currently hidden (see `sections.research.enabled`); the entries stay
// here so the agent corpus has structured grounding and so flipping the
// flag re-publishes them without code changes.
export const research: Research[] = z.array(ResearchSchema).parse([
	{
		slug: "acosus-backend",
		title: "ACOSUS — backend for a student-risk prediction platform",
		venue: "NEIU · ACOSUS research platform",
		year: 2024,
		abstract:
			"Survey-driven student-risk prediction backend for an NEIU research platform. One Express app exposes 327 REST endpoints across two API versions to students, advisors, and admins; readiness-score calculation and KNN training triggers happen here, while predictions hand off to a separate Flask model service. Deep built and runs this solo — 157 commits over 23 months, 73.4k LOC of TypeScript.",
		tags: ["TypeScript", "Node.js", "Express", "MongoDB", "Docker", "KNN"],
	},
	{
		slug: "acosus-frontend",
		title: "ACOSUS — role-aware student-success dashboard",
		venue: "NEIU · ACOSUS research platform",
		year: 2024,
		abstract:
			"Single React SPA with three role-aware shells (student, advisor, admin) plus a public marketing site. 110 lazy-loaded routes, 102k LOC of TypeScript, built mostly solo (151 of 155 commits) across 23 months. Includes a custom TanStack Query retry policy that skips 401/403 so expired sessions surface immediately, and a GitHub Actions deploy that renews SSL when fewer than 30 days remain on the cert.",
		tags: [
			"TypeScript",
			"React 18",
			"Vite",
			"TanStack Query",
			"shadcn/ui",
			"Docker",
		],
	},
	{
		slug: "acosus-model",
		title: "ACOSUS — KNN + PWRS model service",
		venue: "NEIU · ACOSUS research platform",
		year: 2024,
		abstract:
			"Flask ML service that predicts student success rates from survey-style factor answers. Started as a TensorFlow neural net, became a scikit-learn KNN regressor when the cohort stayed too small for stable NN training; kept the legacy NN alive under /archived/* for backward compatibility. PWRS (priority-weighted response scoring) calibration sits on top of the KNN output, and every training run drops a reproducibility bundle of joblib artifacts + feature schema to disk. Two model lineages, 96 commits over 22 months, 4.7k LOC across 29 modules.",
		tags: ["Python", "Flask", "scikit-learn", "TensorFlow", "Docker"],
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
		items: ["TypeScript", "Python", "Java", "JavaScript", "SQL", "Bash"],
	},
	{
		group: "Backend",
		items: [
			"Spring Boot",
			"FastAPI",
			"Express",
			"Node.js",
			"Flask",
			"Pydantic",
		],
	},
	{
		group: "Frontend",
		items: [
			"React 19",
			"Vite",
			"TanStack Query",
			"Redux Toolkit",
			"shadcn/ui",
			"Tailwind",
			"React Flow",
			"Lexical",
		],
	},
	{
		group: "Data",
		items: [
			"PostgreSQL",
			"MongoDB",
			"MySQL",
			"Redis",
			"Qdrant",
			"SQLAlchemy",
			"Mongoose",
			"JPA",
		],
	},
	{
		group: "AI",
		items: [
			"LangGraph",
			"LangChain",
			"scikit-learn",
			"TensorFlow",
			"DeepEval",
			"Gemini",
			"OpenAI",
			"OpenRouter",
			"RAG",
			"KNN",
		],
	},
	{
		group: "Infra",
		items: [
			"Docker",
			"GitHub Actions",
			"Hetzner",
			"Dokploy",
			"Cloudflare",
			"Traefik",
			"GHCR",
		],
	},
	// TODO: confirm with Deep — Sports + Fun lists are carried over from the
	// seed content. Send the real list of hobbies / interests.
	{
		group: "Sports",
		items: ["Cricket", "Tennis", "Long-distance running"],
	},
	{
		group: "Fun",
		items: ["Mechanical keyboards", "Trail photography", "Lo-fi production"],
	},
]);
