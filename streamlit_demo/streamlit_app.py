"""Lightweight public demo for the NewsSnap transformer classifier.

The UI calls the deployed FastAPI service when it is available. If the service
is sleeping or unavailable, the app remains usable with a clearly labelled,
deterministic keyword baseline. The fallback is never presented as DistilBERT.
"""

from __future__ import annotations

import os
import re
from typing import Any

import pandas as pd
import requests
import streamlit as st


DEFAULT_API_URL = "https://newssnap.onrender.com"
LABELS = ("World", "Sports", "Business", "Sci/Tech")
KEYWORDS = {
    "World": (
        "government", "president", "minister", "election", "treaty", "military",
        "country", "border", "sanction", "diplomat", "refugee", "summit",
    ),
    "Sports": (
        "goal", "score", "league", "team", "player", "coach", "match", "cup",
        "olympic", "cricket", "football", "tennis", "basketball", "champion",
    ),
    "Business": (
        "stock", "market", "shares", "revenue", "profit", "company", "ceo",
        "billion", "ipo", "merger", "earnings", "bank", "sales", "economy",
    ),
    "Sci/Tech": (
        "ai", "software", "hardware", "chip", "nasa", "space", "research",
        "technology", "cyber", "data", "quantum", "robot", "biotech", "internet",
    ),
}
SAMPLES = {
    "Technology": "Researchers unveil a new AI chip that reduces data-center energy use.",
    "Sports": "The team won the championship after scoring twice in the final match.",
    "Business": "Shares rise after the company reports stronger quarterly revenue and profit.",
    "World": "Government ministers meet at an international summit to discuss a new treaty.",
}
CLASS_RESULTS = pd.DataFrame(
    {
        "Class": LABELS,
        "Precision": (0.8292, 0.9482, 0.8606, 0.8417),
        "Recall": (0.8983, 0.9697, 0.7963, 0.8153),
        "F1": (0.8624, 0.9588, 0.8272, 0.8283),
        "Support": (3000, 3000, 3000, 3000),
    }
)


def api_url() -> str:
    """Read an optional deployment override without requiring a secret."""
    try:
        configured = st.secrets.get("NEWSSNAP_API_URL", "")
    except FileNotFoundError:
        configured = ""
    return str(configured or os.getenv("NEWSSNAP_API_URL") or DEFAULT_API_URL).rstrip("/")


def call_backend(text: str) -> dict[str, Any]:
    """Return the first prediction from the deployed NewsSnap API."""
    response = requests.post(f"{api_url()}/predict", json={"text": text}, timeout=25)
    response.raise_for_status()
    payload = response.json()
    prediction = payload["predictions"][0]
    prediction["mode"] = payload.get("mode", "unknown")
    return prediction


def heuristic_prediction(text: str) -> dict[str, Any]:
    """Deterministic offline baseline used only when the API cannot respond."""
    tokens = re.findall(r"[a-z]+", text.lower())
    counts = {
        label: sum(tokens.count(keyword) for keyword in keywords)
        for label, keywords in KEYWORDS.items()
    }
    best = max(LABELS, key=lambda label: (counts[label], -LABELS.index(label)))
    if not any(counts.values()):
        best = "Sci/Tech"
    weights = {label: counts[label] + 1 for label in LABELS}
    total = sum(weights.values())
    probabilities = {label: weights[label] / total for label in LABELS}
    return {
        "label": best,
        "confidence": probabilities[best],
        "probabilities": probabilities,
        "model": "keyword baseline (offline fallback)",
        "mode": "offline-fallback",
    }


st.set_page_config(
    page_title="NewsSnap | Transformer News Classifier",
    layout="wide",
)

st.markdown(
    """
    <style>
      .block-container {max-width: 1120px; padding-top: 2rem;}
      [data-testid="stMetric"] {background: #f7f8fc; border: 1px solid #e5e7eb;
        border-radius: 14px; padding: 14px;}
      .result {border: 1px solid #dbeafe; border-radius: 16px; padding: 18px;
        background: linear-gradient(135deg, #eff6ff, #f8fafc);}
      .eyebrow {color: #2563eb; font-size: .78rem; font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase;}
    </style>
    <div class="eyebrow">NLP • DistilBERT • AG News</div>
    """,
    unsafe_allow_html=True,
)
st.title("NewsSnap transformer classifier")
st.caption(
    "Classify a headline as World, Sports, Business, or Sci/Tech. "
    "The app reports exactly which inference mode produced the result."
)

metric_cols = st.columns(4)
metric_cols[0].metric("Test accuracy", "86.99%")
metric_cols[1].metric("Macro F1", "86.92%")
metric_cols[2].metric("MCC", "0.8270")
metric_cols[3].metric("Held-out samples", "12,000")
st.caption("Saved evaluation snapshot: 2026-02-21. These are test-set metrics, not live-demo measurements.")

left, right = st.columns([1.4, 1], gap="large")
with left:
    st.subheader("Try a headline")
    sample_name = st.selectbox("Example", ("Write my own", *SAMPLES.keys()))
    default_text = "" if sample_name == "Write my own" else SAMPLES[sample_name]
    text = st.text_area(
        "Headline or short news text",
        value=default_text,
        height=150,
        placeholder="Paste a headline or a short news paragraph…",
    )
    classify = st.button("Classify news", type="primary", width="stretch")

with right:
    st.subheader("Model flow")
    st.markdown(
        "**Text** → DistilBERT tokenizer → transformer encoder → "
        "4-class linear head → softmax probabilities"
    )
    st.info(
        "If the hosted API is unavailable, the demo switches to a labelled keyword "
        "baseline. That fallback is useful for UI testing, but it is not the transformer."
    )

if classify:
    if not text.strip():
        st.warning("Enter a headline first.")
    else:
        used_fallback = False
        try:
            result = call_backend(text.strip())
        except (requests.RequestException, KeyError, TypeError, ValueError):
            result = heuristic_prediction(text.strip())
            used_fallback = True

        mode = str(result.get("mode", "unknown"))
        model = str(result.get("model", "unknown"))
        if used_fallback or mode != "real":
            st.warning(
                f"Transformer inference is not active. Result source: {model}; mode: {mode}. "
                "Do not interpret this confidence as a trained-model probability."
            )
        else:
            st.success("Live DistilBERT inference completed.")

        st.markdown(
            f"<div class='result'><div class='eyebrow'>Prediction</div>"
            f"<h2>{result['label']}</h2><div>Source: {model} · Mode: {mode}</div></div>",
            unsafe_allow_html=True,
        )
        probabilities = {
            label: float(result.get("probabilities", {}).get(label, 0.0))
            for label in LABELS
        }
        chart = pd.DataFrame(
            {"Category": list(probabilities), "Probability": list(probabilities.values())}
        ).set_index("Category")
        st.bar_chart(chart, y="Probability", horizontal=True)

with st.expander("Verified test-set details"):
    st.dataframe(
        CLASS_RESULTS.style.format({"Precision": "{:.4f}", "Recall": "{:.4f}", "F1": "{:.4f}"}),
        hide_index=True,
        width="stretch",
    )
    st.caption(
        "Source: the checked-in NewsSnap evaluation snapshot documented in the project README. "
        "The repository does not include the 255 MB model artifact, so deployment mode is shown explicitly."
    )

st.divider()
st.caption("NewsSnap • transparent inference mode • no invented live metrics")
