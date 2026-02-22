"""FastAPI inference service for AG News text classification."""

import json
import os
import random
import re
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.utils.logging_config import setup_logging
from src.utils.rate_limiter import EndpointRateLimiter, RateLimiterMiddleware
from src.utils.validation import ValidationError, validate_text

logger = setup_logging(__name__)

LABEL_MAP = {0: "World", 1: "Sports", 2: "Business", 3: "Sci/Tech"}
MODEL_DIR = os.environ.get("MODEL_DIR", "models/latest")
MAX_TEXTS_PER_REQUEST = 32
MAX_TEXT_LENGTH = 5000
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DASHBOARD_DIST_DIR = PROJECT_ROOT / "dashboard" / "dist"

_model_state = {"mode": None, "artifacts": None, "loaded_at": None}
_start_time = time.time()


class PredictRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"text": "Apple releases new AI chip for data centers"},
                {"texts": ["NASA launches satellite", "Lakers win championship"]},
            ]
        }
    )

    @field_validator("text", mode="before")
    @classmethod
    def validate_text_field(cls, value):
        if value is not None and not isinstance(value, str):
            raise ValueError("text must be a string")
        return value

    @field_validator("texts", mode="before")
    @classmethod
    def validate_texts_field(cls, value):
        if value is not None:
            if not isinstance(value, list):
                raise ValueError("texts must be a list of strings")
            if len(value) > MAX_TEXTS_PER_REQUEST:
                raise ValueError(f"Maximum {MAX_TEXTS_PER_REQUEST} texts per request")
            if not all(isinstance(text, str) for text in value):
                raise ValueError("All items in texts must be strings")
        return value


class ClassProbabilities(BaseModel):
    World: float
    Sports: float
    Business: float
    SciTech: float = Field(alias="Sci/Tech")

    model_config = ConfigDict(populate_by_name=True)


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


_KEYWORD_RULES = {
    0: [
        r"\b(war|peace|government|president|minister|election|vote|country|nation|treaty|UN|united nations|summit|diplomat|refugee|military|army|conflict|politics|foreign|border|sanction|humanitarian)\b",
    ],
    1: [
        r"\b(goal|score|win|won|defeat|champion|league|team|player|coach|game|match|tournament|cup|olympic|medal|NFL|NBA|FIFA|cricket|football|soccer|tennis|baseball|basketball|race|athlete)\b",
    ],
    2: [
        r"\b(stock|market|shares|revenue|profit|company|CEO|billion|million|IPO|invest|acquisition|merger|earnings|growth|trade|economy|financial|bank|startup|venture|sales|quarterly|fiscal)\b",
    ],
    3: [
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
            count = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) for pattern in patterns)
            scores[label_id] = count + random.uniform(0.01, 0.3)

        total = sum(scores.values())
        if total < 1.0:
            scores[3] += 0.5
            total = sum(scores.values())

        probs = {label_id: scores.get(label_id, 0.01) / total for label_id in range(4)}

        pred_label = max(probs, key=probs.get)
        probs[pred_label] += random.uniform(0.15, 0.3)
        total_prob = sum(probs.values())
        probs = {key: round(value / total_prob, 4) for key, value in probs.items()}

        results.append(
            {
                "text": text[:200] + "..." if len(text) > 200 else text,
                "label": LABEL_MAP[pred_label],
                "confidence": round(probs[pred_label], 4),
                "probabilities": {LABEL_MAP[key]: value for key, value in probs.items()},
                "model": "demo-heuristic",
                "latency_ms": round(random.uniform(1, 8), 2),
            }
        )
    return results


def _real_predict(texts: List[str]) -> List[dict]:
    """Real DistilBERT inference using loaded model artifacts."""
    from src.serving.inference import input_fn, predict_fn

    started = time.time()
    input_data = input_fn(json.dumps({"text": texts}))
    raw_results = predict_fn(input_data, _model_state["artifacts"])
    elapsed_ms = (time.time() - started) * 1000

    per_item_ms = elapsed_ms / len(texts) if texts else 0
    return [
        {
            "text": item["text"],
            "label": item["predicted_class"],
            "confidence": item["confidence"],
            "probabilities": item["probabilities"],
            "model": "distilbert-base-uncased",
            "latency_ms": round(per_item_ms, 2),
        }
        for item in raw_results
    ]


def _maybe_download_model_from_s3(model_path: Path) -> None:
    """
    Optionally download model artifacts from S3 when local model files are missing.

    Enabled when:
    - S3_BUCKET_MODELS is set
    - and MODEL_DIR does not already contain config.json
    """
    if model_path.exists() and (model_path / "config.json").exists():
        return

    bucket = os.environ.get("S3_BUCKET_MODELS")
    prefix = os.environ.get("MODEL_S3_PREFIX", "public/models/latest").strip("/")
    region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    if not bucket:
        return

    try:
        import boto3

        logger.info("Model not found locally. Attempting S3 download from s3://%s/%s", bucket, prefix)
        s3 = boto3.client("s3", region_name=region)
        paginator = s3.get_paginator("list_objects_v2")

        downloaded = 0
        total_bytes = 0
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                rel = key[len(prefix):].lstrip("/")
                if not rel:
                    continue

                destination = model_path / rel
                destination.parent.mkdir(parents=True, exist_ok=True)
                s3.download_file(bucket, key, str(destination))
                downloaded += 1
                total_bytes += int(obj.get("Size", 0))

        logger.info(
            "Downloaded %d model artifact(s) from S3 (%d bytes) into %s",
            downloaded,
            total_bytes,
            model_path,
        )
    except Exception as exc:
        logger.warning("S3 model download failed: %s", exc)


def _load_model() -> None:
    """Load model on startup with fallback to demo mode."""
    model_path = Path(MODEL_DIR)
    logger.info("Attempting to load model from %s", MODEL_DIR)
    _maybe_download_model_from_s3(model_path)

    if model_path.exists() and (model_path / "config.json").exists():
        try:
            from src.serving.inference import model_fn

            _model_state["artifacts"] = model_fn(str(model_path))
            _model_state["mode"] = "real"
            _model_state["loaded_at"] = time.time()
            logger.info("Successfully loaded model from %s", MODEL_DIR)
            return
        except Exception as exc:
            logger.warning("Failed to load model: %s. Falling back to demo mode.", exc)

    _model_state["mode"] = "demo"
    _model_state["artifacts"] = None
    _model_state["loaded_at"] = time.time()
    logger.warning("Running in demo mode")


@asynccontextmanager
async def lifespan(_: FastAPI):
    _load_model()
    yield


app = FastAPI(
    title="LLMOps Inference API",
    description="AG News text classification - DistilBERT",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimiterMiddleware, requests_per_minute=100)

endpoint_limiter = EndpointRateLimiter()
endpoint_limiter.set_limit("predict", requests_per_window=50, window_seconds=60)


@app.get("/health", response_model=HealthResponse)
def health():
    return {
        "status": "healthy",
        "mode": _model_state["mode"] or "initializing",
        "model_dir": MODEL_DIR if _model_state["mode"] == "real" else None,
        "uptime_seconds": round(time.time() - _start_time, 1),
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest, request: Request):
    """Run inference on provided text(s)."""
    try:
        client_ip = request.client.host if request.client else "unknown"
        await endpoint_limiter.rate_limit_check("predict", client_ip)

        if req.text is not None:
            texts = [validate_text(req.text, min_length=1, max_length=MAX_TEXT_LENGTH, name="text")]
        elif req.texts is not None:
            texts = [
                validate_text(text, min_length=1, max_length=MAX_TEXT_LENGTH, name=f"texts[{idx}]")
                for idx, text in enumerate(req.texts)
            ]
        else:
            logger.warning("Prediction request missing both text and texts")
            raise HTTPException(
                status_code=400,
                detail="Provide either 'text' (string) or 'texts' (list of strings)",
            )

        if not texts:
            logger.warning("Prediction request with empty texts")
            raise HTTPException(status_code=400, detail="Texts cannot be empty")

        logger.info("Prediction request from %s: %d text(s)", client_ip, len(texts))

        mode = _model_state.get("mode") or "demo"
        predictions = _real_predict(texts) if mode == "real" else _demo_predict(texts)

        logger.debug("Prediction completed: %d results", len(predictions))
        return {
            "predictions": predictions,
            "mode": mode,
            "model_dir": MODEL_DIR if mode == "real" else None,
        }
    except ValidationError as exc:
        logger.error("Validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in predict: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/")
def root():
    index_file = DASHBOARD_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    return {
        "service": "LLMOps Inference API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "predict": "POST /predict",
    }


if (DASHBOARD_DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DASHBOARD_DIST_DIR / "assets")), name="dashboard-assets")


@app.get("/{full_path:path}", include_in_schema=False)
def dashboard_spa_fallback(full_path: str):
    if not DASHBOARD_DIST_DIR.exists():
        raise HTTPException(status_code=404, detail="Not found")

    requested = DASHBOARD_DIST_DIR / full_path
    if requested.is_file():
        return FileResponse(requested)

    index_file = DASHBOARD_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    raise HTTPException(status_code=404, detail="Not found")
