---
slug: atelier
title: Atelier
status: running
summary: rag chatbot for academic papers — langgraph router, qdrant vectors, gemini default with openai fallback
pitch: a streamlit app where you drop in a pdf, url, or arxiv id and ask questions grounded in the paper. a langgraph router splits each query into retrieve, verify-claim, or direct-answer, and the whole thing runs publicly behind per-ip caps and a kill switch.
endpoint: "curl -s atelier.deepmandloi.com"
cta: visit site
meta: langgraph · gemini · dokploy on hetzner
tags:
  - Python
  - LangGraph
  - Qdrant
  - Streamlit
  - Gemini
  - DeepEval
bullets:
  - router splits queries 3 ways before retrieval
  - sqlite checkpointer per session — history survives restarts
  - 5 deepeval metrics graded at threshold 0.7
  - per-ip daily cap + offline kill switch before going public
  - one-click dokploy deploy from a ghcr image
links:
  live: https://atelier.deepmandloi.com
stats:
  - { value: "3.0k", label: "python LOC", sublabel: "across 17 modules" }
  - { value: "5", label: "RAG metrics", sublabel: "deepeval-graded @ 0.7" }
  - { value: "live", label: "atelier.deepmandloi.com", sublabel: "dokploy on hetzner", pulse: true }
screenshots:
  - { path: "hero.png", caption: "chat session grounded in an uploaded paper" }
  - { path: "detail.png", caption: "langgraph state + transcript view" }
---

# Atelier

## Overview

atelier is a rag chatbot for academic papers. deep built it so a student or researcher can drop in a pdf, a url, or an arxiv id, get the doc chunked and embedded into an isolated qdrant collection, and then ask questions that get answered from the paper instead of from the model's priors.

it started as a workshop project to ship langgraph + deepeval end-to-end rather than read about them. the version that's live today routes every query through a classifier first — retrieve-from-paper, verify-a-claim against the web and arxiv, or just answer directly — so a question like "is this finding still current?" runs a different graph than "what's the methodology?"

## Challenges

the langchain-google-genai 4.2.3 client had a broken `embed_documents` when called with a batch — silent wrong-shape returns. deep wrapped it in a small `_PerQueryEmbeddings` adapter in the llm factory that re-routes batches to single calls. ugly, but the rest of the rag pipeline didn't have to know.

deepeval's default judge text-parses json out of the model response. with gemini that was flaky, so deep wrote a custom judge in `backend/eval_judge.py` that uses gemini's `responseSchema` to force structured output. the first eval run then hit gemini's free-tier rate limit immediately — 5 metrics × goldens × parallel workers was too much — so the runner got capped at 3 workers with a 5-second throttle.

the bigger shift was the last two commits. turning a localhost demo into something that could sit on the open internet meant adding a sqlite-backed per-ip daily cap, a per-session message cap, file-size and chunk limits on ingest, and an `APP_OFFLINE=1` env flag that disables the llm calls but leaves the read-only ui working. none of it was interesting code, but without it the gemini key would have been drained by the first crawler.

## Learnings

langgraph earns its abstraction tax once you have more than two branches. the router + relevancy check + single rewrite gave bounded retry behavior — at most 3 retrieval attempts and 1 query rewrite — without the infinite loops you get from naive agentic patterns.

vendor portability is mostly an embedding-cache problem, not an llm-call problem. the factory lets you flip `LLM_PROVIDER=openai` and the chat path just works, but the qdrant collections were embedded with one model's vectors and don't move with you. next time deep would keep the embedding choice and the chat choice as separate decisions from day one.

evaluating rag is mostly about measurement, not about the model. deepeval's contextual precision + recall + faithfulness scores caught a class of confident-but-unsupported answers that eyeballing the chat would have missed. the eval pipeline is now the thing he'd build first on the next rag project, not last.

## Stack

python 3.14, streamlit for the ui, langgraph for the workflow, qdrant cloud for vectors with langchain's `CacheBackedEmbeddings` writing to local disk so restarts don't re-embed. gemini 2.5-flash by default (free tier), openai as a fallback through a small llm factory. deepeval for the test pipeline with a custom gemini judge, tavily for web search, sqlite checkpointer for per-session history. docker image on ghcr, dokploy on a 4gb hetzner vps behind traefik and let's encrypt.

## What's next

still running. on the list: a wider eval set than the single research-report pdf, cite-as-you-answer inline citations in the ui, and an async ingest worker so a 200-page pdf doesn't block the chat thread while it embeds.

---

## Resume pointers

Drop-in language for a resume, tightened to action-verb-led bullets with numbers from `RESUME_EVIDENCE.md` and the codebase. Use the project header, pick 3–5 bullets, swap the framing by target role.

### Project header

> **Atelier — RAG Research Paper Assistant** · Python, LangGraph, Qdrant, Streamlit, Gemini/OpenAI, DeepEval · [atelier.deepmandloi.com](https://atelier.deepmandloi.com) · [github.com/mandloideep/atelier](https://github.com/mandloideep/atelier)

One-liner (for the summary line under the project title):

> Solo-built a retrieval-augmented research assistant that ingests PDFs, URLs, and arXiv IDs, routes each query through a LangGraph workflow, and serves grounded answers behind per-IP quotas and an offline kill switch.

### Bullets — pick 3 to 5

**ML/AI engineering framing:**
- Designed a 3-branch LangGraph router (retrieve / verify-claim / direct-answer) over a tool-bound agent with bounded retry (3 attempts, 1 query rewrite), eliminating infinite-loop failure modes common in agentic RAG.
- Built a provider-agnostic LLM factory abstracting Gemini and OpenAI behind one interface; worked around a batched-embedding bug in `langchain-google-genai 4.2.3` with a per-query adapter so the rest of the pipeline stayed vendor-neutral.
- Stood up a DeepEval pipeline with 5 metrics at threshold 0.7 (contextual precision/recall/relevancy, answer relevancy, faithfulness); scored 1.00 recall, 0.99 answer relevancy, and 0.98 faithfulness across 10 synthetic goldens, then traced the 50% overall pass rate to a retrieval-precision issue rather than answer quality.
- Authored a custom DeepEval judge using Gemini's `responseSchema` to replace the flaky text-to-JSON default, and throttled the eval runner to 3 workers / 5s spacing after the first run tripped the free-tier rate limit.

**Full-stack / shipping framing:**
- Shipped a 3.0k-LOC Python service to production on a 4GB Hetzner VPS using Dokploy, Traefik, Let's Encrypt, and a manually-triggered GitHub Actions workflow that builds and pushes to GHCR.
- Hardened the demo for public traffic before exposing it: SQLite-backed per-IP daily caps, per-session message limits, file-size and chunk caps on ingest, and an `APP_OFFLINE=1` env flag that disables all LLM calls while keeping the read-only UI alive.
- Isolated sessions end-to-end with a per-session Qdrant collection and a dedicated LangGraph SQLite checkpointer thread, so chat history survives restarts and no two users share retrieval state.
- Reduced cold-start cost by caching embeddings to local disk with LangChain's `CacheBackedEmbeddings`, persisted across deploys via a named Docker volume.

### Trade-offs to mention in interview

- No automated tests yet (intentional — eval pipeline + DeepEval scores act as the regression net for the RAG behavior, but unit tests for the guardrails and ingest path are the next gap).
- 50% pass rate on Contextual Relevancy is a known retrieval-precision tunable (chunk size / `k` / re-ranker), not an answer-quality issue — flag it honestly and walk through the fix.
- Vendor portability is real for the chat path (factory works) but only nominal for embeddings — switching providers would require re-embedding the Qdrant collections. Worth saying out loud.
