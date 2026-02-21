# LLMOps AG News Classifier

Local-first MLOps project for AG News text classification using DistilBERT, FastAPI, and a React dashboard.

## What is included
- Data ingestion and preprocessing (`src/data/*`)
- Local model training and evaluation (`src/models/*`)
- Inference API with rate limiting and validation (`src/serving/api.py`)
- Dashboard with live prediction page (`dashboard/`)
- Optional AWS/SageMaker utilities (not required for local usage)

## Quick Start (Local, No SageMaker)

### 1. Install dependencies
```bash
pip install -r requirements.txt
cd dashboard && npm install && cd ..
```

### 2. Run local pipeline (fast default)
This creates a real local model at `models/latest`.
```bash
py scripts/run_local_pipeline.py
```

Use full dataset training if needed:
```bash
py scripts/run_local_pipeline.py --max-train-samples 0 --max-val-samples 0 --epochs 3 --batch-size 32
```

### 3. Run API
```bash
py -m uvicorn src.serving.api:app --host 127.0.0.1 --port 8000
```

Check health:
```bash
curl http://127.0.0.1:8000/health
```
If model loaded, response includes `"mode":"real"`.

### 4. Run dashboard
```bash
cd dashboard
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173`.

## Deploy Dashboard to Vercel

This repo is configured for Vercel to build the Vite app in `dashboard/` using `vercel.json`.

1. Import this GitHub repo into Vercel.
2. Deploy (no custom build settings needed).
3. Set `VITE_API_URL` in Vercel Project Environment Variables to your backend API base URL.

Without `VITE_API_URL`, classify requests are disabled in production.

## Optional AWS path
AWS/SageMaker scripts and Terraform are still in the repo, but optional. You can complete the entire project locally without AWS costs.

## Useful commands
```bash
# Tests
py -m pytest -q

# Train only
py -m src.models.train --data-dir data/processed --model-dir models/latest --epochs 1 --max-train-samples 3000 --max-val-samples 600

# Evaluate only
py -m src.models.evaluate --model-dir models/latest --test-data data/processed/test.jsonl
```

## Git push checklist
```bash
git add .
git commit -m "Local-first pipeline + realtime dashboard + API hardening"
git push
```
