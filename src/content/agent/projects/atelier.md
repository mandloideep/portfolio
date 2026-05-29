# Atelier

## Overview

Atelier is a RAG chatbot for academic papers. Deep built it so a
student or researcher can drop in a PDF, a URL, or an arXiv ID, get
the doc chunked and embedded into an isolated Qdrant collection, and
then ask questions that get answered from the paper instead of from
the model's priors.

It started as a workshop project to ship LangGraph + DeepEval
end-to-end rather than read about them. The version that's live today
routes every query through a classifier first (retrieve-from-paper,
verify-a-claim against the web and arXiv, or just answer directly),
so a question like "is this finding still current?" runs a different
graph than "what's the methodology?"

## Challenges

The `langchain-google-genai` 4.2.3 client had a broken
`embed_documents` when called with a batch: silent wrong-shape
returns. Deep wrapped it in a small `_PerQueryEmbeddings` adapter in
the LLM factory that re-routes batches to single calls. Ugly, but the
rest of the RAG pipeline didn't have to know.

DeepEval's default judge text-parses JSON out of the model response.
With Gemini that was flaky, so Deep wrote a custom judge in
`backend/eval_judge.py` that uses Gemini's `responseSchema` to force
structured output. The first eval run then hit Gemini's free-tier
rate limit immediately. 5 metrics × goldens × parallel workers was
too much, so the runner got capped at 3 workers with a 5-second
throttle.

The bigger shift was the last two commits. Turning a localhost demo
into something that could sit on the open internet meant adding a
SQLite-backed per-IP daily cap, a per-session message cap, file-size
and chunk limits on ingest, and an `APP_OFFLINE=1` env flag that
disables the LLM calls but leaves the read-only UI working. None of
it was interesting code, but without it the Gemini key would have
been drained by the first crawler.

## Learnings

LangGraph earns its abstraction tax once you have more than two
branches. The router + relevancy check + single rewrite gave bounded
retry behavior — at most 3 retrieval attempts and 1 query rewrite,
without the infinite loops you get from naive agentic patterns.

Vendor portability is mostly an embedding-cache problem, not an
LLM-call problem. The factory lets you flip `LLM_PROVIDER=openai` and
the chat path just works, but the Qdrant collections were embedded
with one model's vectors and don't move with you. Next time Deep
would keep the embedding choice and the chat choice as separate
decisions from day one.

Evaluating RAG is mostly about measurement, not about the model.
DeepEval's contextual precision + recall + faithfulness scores caught
a class of confident-but-unsupported answers that eyeballing the chat
would have missed. The eval pipeline is now the thing he'd build
first on the next RAG project, not last.

## Stack

Python 3.14, Streamlit for the UI, LangGraph for the workflow,
Qdrant Cloud for vectors with LangChain's `CacheBackedEmbeddings`
writing to local disk so restarts don't re-embed. Gemini 2.5-flash by
default (free tier), OpenAI as a fallback through a small LLM
factory. DeepEval for the test pipeline with a custom Gemini judge,
Tavily for web search, SQLite checkpointer for per-session history.
Docker image on GHCR, Dokploy on a 4GB Hetzner VPS behind Traefik and
Let's Encrypt.

## What's next

Still running. On the list: a wider eval set than the single
research-report PDF, cite-as-you-answer inline citations in the UI,
and an async ingest worker so a 200-page PDF doesn't block the chat
thread while it embeds.
