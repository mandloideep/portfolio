Education
Northeastern Illinois University Chicago, IL
Masters of Science in Computer Science Aug. 2023 – Dec 2025

Experience
CS Instructor Jan 2026 – Present
Northeastern Illinois University Chicago, IL (Hybrid)
• Deliver structured CS300 (Web Development) training to undergraduate cohorts, tailoring instruction to diverse skill levels and learning styles.
• Author course documentation, lab guides, setup instructions, and assessment rubrics that produce consistent, reproducible learning outcomes.
• Troubleshoot student environment configuration issues across operating systems, reinforcing systematic debugging and technical-support skills.


AI Engineer | Research Assistant April 2024 – Present
Northeastern Illinois University Chicago, IL
• Spearheaded the transformation of a 7,000+ LOC JavaScript codebase into a 130,000+ LOC TypeScript platform, enabling dynamic surveys and multi-user roles and increasing code maintainability and scalability by 60%.
• Improved front-end load times by 50% through lazy loading and code-splitting with React Router and React Query, resulting in faster user interactions and a smoother user experience.
• Designed and optimized SQL and NoSQL database schemas and built aggregation pipelines and caching layers that reduced data-retrieval times by 34% and improved system responsiveness.
• Implemented CI/CD pipelines with GitHub Actions and Docker, automating deployments and reducing release cycles by 40% and ensuring on-time delivery of project milestones.


Projects
CommentDraw | live | repo Sep 2025 – May 2026
Java 21, Spring Boot 3.5, React 19, MySQL, Redis, Stripe, Docker, GitHub Actions
• Shipped a full-stack subscription SaaS solo — 5 REST controllers, 15 services, 10 JPA entities, 154 commits — deployed via GitHub Actions to Docker Hub and Render, with 21 backend tests covering all 5 controllers and 13 service implementations.
• Built OAuth2 (Google) and stateless JWT auth with HttpOnly refresh-token rotation, fronted by an RTK Query baseQueryWithReAuth wrapper that transparently refreshes on 401 and retries the original request.
• Integrated Stripe Checkout with HMAC-verified webhooks for a 3-tier plan model (FREE / GOLD / DIAMOND), enforcing per-plan quotas at the service layer before any external API call.
• Engineered Redis-backed Bucket4j distributed rate limiting to protect the YouTube Data API quota, plus an event-driven email pipeline (Spring ApplicationEventPublisher → Brevo via OkHttp)


Atelier — Research Paper Assistant | repo Dec 2025 – Present
Python, LangGraph, LangChain, Qdrant, OpenAI, Tavily, DeepEval, Streamlit, Docker
• Built a LangGraph + LangChain RAG assistant with an LLM router across retrieval, claim-verification, and direct-answer paths over per-session Qdrant collections, preventing cross-session leakage.
• Designed an agentic retrieval loop with bounded query-rewrite retries (≤ 3) and a claim-verification subsystem that cross-checks via ArXiv and Tavily, surfacing superseding work.
• Stood up a DeepEval pipeline scoring 5 RAG metrics (Contextual Precision/Recall/Relevancy, Answer Relevancy, Faithfulness) with throttled async execution; hit 1.00 recall, 0.99 answer-relevancy, and 0.98 faithfulness on 10 synthetic goldens.


WorkflowBuilder (n8n-inspired) | repo Nov 2025 – Dec 2025
Python, FastAPI, SQLAlchemy, SQLite, React, TypeScript, Vite, ReactFlow, Zustand, Tailwind
• Designed a full-stack visual workflow automation platform with drag-and-drop authoring (ReactFlow + Zustand) over a FastAPI service.
• Engineered an async, topological-sort DAG executor in Python with dependency-respecting ordering, shared-context propagation, and per-node status tracking.
• Shipped a pluggable node model with 3 working integrations (SMTP email, Telegram, HTTP webhook triggers) over JWT-authenticated REST APIs.


Leadership & Open Source
Open Source Contributor Aug 2025 – Present
Dokploy Remote
• Developed full-stack enhancements for an open-source deployment platform, including a profile-picture upload system and API/CLI metadata customization, contributing to an open-source alternative to commercial deployment solutions.
• Resolved an SSH connection bug in IP-address parsing logic and shipped user-profile improvements, strengthening deployment reliability and platform usability.


Peer Mentor May 2025 – Dec 2025
CodePath Remote
• Mentored first-time CodePath students through personalized, semester-long guidance and monthly 1:1 check-ins focused on study strategies, platform tools, and community resources.
• Coached mentees toward independent problem-solving; 83% reported increased confidence in completing their course.
