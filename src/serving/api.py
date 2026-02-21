"""
FastAPI Inference Server for LLMOps
Serves DistilBERT text classification predictions.

- Real mode:  loads trained model from models/latest/
- Demo mode:  if no model exists, uses keyword heuristics for realistic predictions

Run:  uvicorn src.serving.api:app --host 0.0.0.0 --port 8000
"""

import json
import os
import random
import re
import time
from pathlib import Path
from typing import List, Optional, Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── App ──
app = FastAPI(
    title="LLMOps Inference API",
    description="AG News text classification — DistilBERT",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LABEL_MAP = {0: "World", 1: "Sports", 2: "Business", 3: "Sci/Tech"}
MODEL_DIR = os.environ.get("MODEL_DIR", "models/latest")

# ── State ──
_model_state = {"mode": None, "artifacts": None, "loaded_at": None}


# ── Request / Response schemas ──
class PredictRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None

    class Config:
        json_schema_extra = {
            "examples": [
                {"text": "Apple releases new AI chip for data centers"},
                {"texts": ["NASA launches satellite", "Lakers win championship"]},
            ]
        }


class ClassProbabilities(BaseModel):
    World: float
    Sports: float
    Business: float
    SciTech: float = Field(alias="Sci/Tech")

    class Config:
        populate_by_name = True


class PredictionResult(BaseModel):
    text: str
    label: str
    confidence: float
    probabilities: dict
    model: str
    latency_ms: float


class PredictResponse(BaseModel):
    predictions: List[PredictionResult]
    mode: str
    model_dir: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    mode: str
    model_dir: Optional[str] = None
    uptime_seconds: float


_start_time = time.time()


# ── Demo mode heuristics ──
_KEYWORD_RULES = {
    0: [  # World
        r"\b(war|peace|government|president|minister|election|vote|country|nation|treaty|UN|united nations|summit|diplomat|refugee|military|army|conflict|politics|foreign|border|sanction|humanitarian)\b",
    ],
    1: [  # Sports
        r"\b(goal|score|win|won|defeat|champion|league|team|player|coach|game|match|tournament|cup|olympic|medal|NFL|NBA|FIFA|cricket|football|soccer|tennis|baseball|basketball|race|athlete)\b",
    ],
    2: [  # Business
        r"\b(stock|market|shares|revenue|profit|company|CEO|billion|million|IPO|invest|acquisition|merger|earnings|growth|trade|economy|financial|bank|startup|venture|sales|quarterly|fiscal)\b",
    ],
    3: [  # Sci/Tech
        r"\b(AI|algorithm|software|hardware|chip|processor|satellite|NASA|space|research|scientist|technology|digital|internet|cyber|data|quantum|robot|biotech|genome|innovation|compute|launch|discover)\b",
    ],
}


def _demo_predict(texts: List[str]) -> List[dict]:
    """Keyword-based heuristic classifier for demo mode."""
    results = []
    for text in texts:
        scores = {}
        text_lower = text.lower()
        for label_id, patterns in _KEYWORD_RULES.items():
            count = sum(len(re.findall(p, text_lower, re.IGNORECASE)) for p in patterns)
            scores[label_id] = count + random.uniform(0.01, 0.3)

        # If no strong signal, bias toward Sci/Tech (common for "tech" demos)
        total = sum(scores.values())
        if total < 1.0:
            scores[3] += 0.5  # slight Sci/Tech bias
            total = sum(scores.values())

        # Normalize to probabilities and add realism
        probs = {}
        for lid in range(4):
            probs[lid] = scores.get(lid, 0.01) / total

        # Make winner more confident (simulate trained model behavior)
        pred_label = max(probs, key=probs.get)
        boost = random.uniform(0.15, 0.3)
        probs[pred_label] += boost
        total_p = sum(probs.values())
        probs = {k: round(v / total_p, 4) for k, v in probs.items()}

        results.append({
            "text": text[:200] + "..." if len(text) > 200 else text,
            "label": LABEL_MAP[pred_label],
            "confidence": round(probs[pred_label], 4),
            "probabilities": {LABEL_MAP[k]: v for k, v in probs.items()},
            "model": "demo-heuristic",
            "latency_ms": round(random.uniform(1, 8), 2),
        })
    return results


def _real_predict(texts: List[str]) -> List[dict]:
    """Real DistilBERT inference using the loaded model."""
    from src.serving.inference import input_fn, predict_fn

    t0 = time.time()
    input_data = input_fn(json.dumps({"text": texts}))
    raw_results = predict_fn(input_data, _model_state["artifacts"])
    elapsed = (time.time() - t0) * 1000

    results = []
    per_item_ms = elapsed / len(texts) if texts else 0
    for r in raw_results:
        results.append({
            "text": r["text"],
            "label": r["predicted_class"],
            "confidence": r["confidence"],
            "probabilities": r["probabilities"],
            "model": "distilbert-base-uncased",
            "latency_ms": round(per_item_ms, 2),
        })
    return results


# ── Startup ──
@app.on_event("startup")
def load_model():
    model_path = Path(MODEL_DIR)
    if model_path.exists() and (model_path / "config.json").exists():
        try:
            from src.serving.inference import model_fn
            _model_state["artifacts"] = model_fn(str(model_path))
            _model_state["mode"] = "real"
            _model_state["loaded_at"] = time.time()
            print(f"[API] Loaded model from {MODEL_DIR}")
        except Exception as e:
            print(f"[API] Failed to load model: {e}. Falling back to demo mode.")
            _model_state["mode"] = "demo"
    else:
        print(f"[API] No model at {MODEL_DIR}. Running in demo mode.")
        _model_state["mode"] = "demo"


# ── Endpoints ──
@app.get("/health", response_model=HealthResponse)
def health():
    return {
        "status": "healthy",
        "mode": _model_state["mode"] or "initializing",
        "model_dir": MODEL_DIR if _model_state["mode"] == "real" else None,
        "uptime_seconds": round(time.time() - _start_time, 1),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    # Extract texts from request
    texts = []
    if req.text:
        texts = [req.text]
    elif req.texts:
        texts = req.texts
    else:
        raise HTTPException(status_code=400, detail="Provide 'text' (string) or 'texts' (list)")

    if len(texts) > 32:
        raise HTTPException(status_code=400, detail="Max 32 texts per request")

    # Predict
    mode = _model_state.get("mode", "demo")
    if mode == "real":
        predictions = _real_predict(texts)
    else:
        predictions = _demo_predict(texts)

    return {
        "predictions": predictions,
        "mode": mode,
        "model_dir": MODEL_DIR if mode == "real" else None,
    }


@app.get("/")
def root():
    return {
        "service": "LLMOps Inference API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "predict": "POST /predict",
    }
