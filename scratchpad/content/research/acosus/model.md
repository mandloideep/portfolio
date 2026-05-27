---
slug: acosus-model
title: ACOSUS Model Service
status: running
summary: flask ml service that predicts student success rates for an neiu research project, built around knn + pwrs calibration.
pitch: deep built the model side of acosus — a research tool at northeastern illinois that turns survey answers into a calibrated student-success score. it started as a tensorflow neural net, became a knn regressor when the dataset stayed small, and is now the backbone of an ongoing progressive-learning paper.
endpoint: curl -s localhost:5051/predict | jq .pwrs_score
cta: view repo
meta: flask + sklearn · 96 commits over 22 months · two model lineages, one still in archived/
tags:
  - Python
  - Flask
  - scikit-learn
  - TensorFlow
  - Docker
bullets:
  - shipped knn + pwrs calibration end-to-end in prod
  - kept the legacy tf nn alive under /archived/* for old clients
  - streamed real-time training progress back to the express backend
  - designed a 1047-line progressive learning framework spec
links:
  repo: https://github.com/acosus/model
stats:
  - { value: "96 commits", label: "commits", sublabel: "over 22 months", pulse: true }
  - { value: "4.7k LOC", label: "python", sublabel: "29 files in app/ + archived/" }
  - { value: "2 lineages", label: "shipped", sublabel: "knn in app/, tf nn in archived/" }
screenshots:
  - { path: "hero.png", caption: "training progress streaming back to the express backend" }
  - { path: "detail.png", caption: "pwrs calibration curve from a committed run in models/" }
---

# acosus model service

## overview

deep built the model service for acosus, a research project at northeastern illinois that predicts student success rates from survey-style factor answers. the service is a flask app — `/predict`, `/train`, `/health`, plus a `/success_rate` endpoint that runs pwrs (priority-weighted response scoring) calibration on top of the knn output. it talks to an express backend over an `EXPRESS_URL` callback so the ui can show training progress in real time.

it's not a public product. the users are the researchers running the study and the express backend that drives the survey ui. the goal is paper figures and a deployable pipeline for the next cohort, not signups.

## challenges

the first version was a tensorflow neural net — dense layers, relu, dropout, then a v2 with priority-based feature engineering, minmaxscaler, and earlystopping. it kept overfitting because the cohort was tiny. deep pivoted the production path to a knn regressor in `app/models/knn_model.py` (k from sqrt/log/fixed, 5-fold cv + loocv, hybrid alpha blend between raw knn score and pwrs factor score) and parked the nn work under `archived/` so existing clients kept working at `/archived/*`. clipping predictions to `[0, 100]` and writing a `data_quality.json` per run for the paper figures took more iterations than expected.

pwrs itself was the other hard part. the four-step calculator in `app/generators/dynamicSuccessRateGen.py` (normalize → priority-weight → base score → logistic calibration) needed tuning per feature schema, and the calibration coefficients had to be persisted alongside the joblib artifacts so a reload reproduced the exact score. each training run drops `knn_model.joblib`, `scaler.joblib`, `feature_names.json`, `feature_schema.json`, `config.json`, `training_request.json`, and `data_quality.json` into `models/<timestamp>_<slug>_<id>/` — reproducibility was the whole point.

then there was docker. tensorflow needs `libhdf5-dev` in the slim image or the build dies silently. the `requirements.txt` is 13 unpinned packages, which is fine until it isn't, and deep is still putting off pinning them. ci is four github actions workflows (build-dev, build-prod, deploy-prod, deploy) doing multi-platform docker builds and pushing to dockerhub.

## learnings

the biggest one: knn beat the neural net not because knn is better but because the dataset was too small for the nn to learn anything stable. lesson — pick the model that fits the data you have today, not the one that looks good on the slide. for paper figures, knn's interpretability (neighbor distribution, per-feature importance, confidence intervals from the local label spread) was worth more than a fractional accuracy bump from a bigger model.

deep wrote a `BaseModel` abstract class in `app/models/base_model.py` before there was a second model to fit it. classic premature abstraction. it pays off the day the gan stage ships and not a day sooner. he'd skip it next time and refactor once two concrete implementations actually existed.

what he'd do differently: pin `requirements.txt`, write at least smoke tests (there are zero test files in the repo), and stop shipping the design doc and the implementation in separate commits — the `new_feature.md` spec drifted from reality the moment the gan stage didn't ship on the original timeline.

## stack

python 3.12, flask + flask-cors, scikit-learn for the production knn, tensorflow for the legacy nn under `archived/`, pandas + numpy, joblib for model persistence, pymongo for db reads, the openai sdk for the genai prompt route, matplotlib + seaborn for the paper figures. packaged in two docker images (prod + a dev one with watchmedo hot reload), built and deployed by four github actions workflows.

## what's next

the `new_feature.md` design doc maps a progressive learning framework: knn first (shipped), then gan-based data augmentation, then a neural net trained on the augmented set, with feedback-driven pseudo-labeling once real responses start flowing back. the gan and pseudo-labeling stages are designed but not implemented. fresh evaluation on the production cohort is the other open thread — the two committed runs in `models/` are from an early small dataset and aren't representative. and yes, pin the deps.

---

## resume pointers

Use these on a resume / LinkedIn. Pick 3–4 bullets max depending on the role you're targeting (ML-leaning vs. backend-leaning vs. research-leaning). Past tense, strong verbs, quantified where the repo supports it.

### Header line (for the experience block)

> **ML Research Engineer — ACOSUS, Northeastern Illinois University**
> *Jun 2024 – present · Python, Flask, scikit-learn, TensorFlow, Docker*

### Bullets — pick 3–4

**ML-leaning (lead with the modeling):**
- Designed and shipped a Flask ML service (~4.7k LOC Python, 29 modules) predicting student success rates for an NEIU research cohort, replacing a TensorFlow neural network with a scikit-learn KNN regressor after the production dataset proved too small for stable NN training.
- Built a Priority-Weighted Response Scoring (PWRS) calibration layer — normalize → priority-weight → base score → logistic calibration — and a hybrid alpha-blend between KNN output and PWRS factor scores; persisted calibration coefficients with every model artifact so reloads reproduced scores exactly.
- Authored a 1,047-line progressive-learning framework spec (KNN → GAN-augmented NN → feedback-driven pseudo-labeling) that frames the research roadmap and underpins an in-progress DSI paper.

**Backend / platform-leaning (lead with the system):**
- Built a Flask ML inference + training service with API-key auth, real-time training-progress callbacks to an Express backend over an `EXPRESS_URL` webhook, and per-run reproducibility artifacts (`knn_model.joblib`, scaler, feature schema, training request, data-quality report).
- Containerized the service in two Docker images (prod + dev w/ `watchmedo` hot reload), and set up four GitHub Actions workflows for multi-platform builds and pushes to DockerHub on every merge.
- Restructured the codebase into `app/` (clean blueprints, abstract `BaseModel`, services layer) and `archived/` (preserved legacy NN routes under `/archived/*` for backward compatibility) across a 1,308-insertion refactor.

**Research-leaning (lead with the outcome):**
- Led the model side of ACOSUS (96 commits over 22 months, ~85% authorship across the team), taking the project from an initial TensorFlow prototype to a KNN + PWRS production pipeline used by the research team's Express-backed survey UI.
- Delivered interpretable predictions (per-feature importance, confidence intervals from neighbor label distribution, 5-fold CV + LOOCV) chosen specifically to support paper figures over marginal accuracy gains from larger models.

### One-line variant (for LinkedIn headline / cover-letter sentence)

> Built the ML service behind ACOSUS at NEIU — Flask + scikit-learn KNN with PWRS calibration, replacing a TensorFlow NN once the cohort proved too small to train one stably.

### Notes for tailoring

- Numbers that hold up under scrutiny: **96 commits**, **22 months**, **~4.7k LOC Python**, **29 modules**, **2 model lineages**, **4 CI workflows**, **1,047-line design doc**. Don't quote model accuracy / MAE — the two committed runs are from a small early dataset and aren't production-representative.
- Drop "led" / "designed" if the role is junior-coded; swap for "built" / "implemented". Keep them for senior / staff / research-engineer applications.
- If asked in an interview "why KNN over the NN?" — the honest answer (small N, interpretability for paper figures, neighbor-distribution confidence intervals) is also the strongest one.
