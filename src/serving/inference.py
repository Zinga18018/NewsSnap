"""SageMaker-compatible inference handlers for text classification."""

import json
import os

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from src.utils.logging_config import setup_logging

logger = setup_logging(__name__)

LABEL_MAP = {0: "World", 1: "Sports", 2: "Business", 3: "Sci/Tech"}
MAX_SEQ_LENGTH = int(os.environ.get("MAX_SEQ_LENGTH", "128"))

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def model_fn(model_dir: str):
    """Load model and tokenizer from the model directory."""
    logger.info("Loading model from %s", model_dir)
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir).to(device)
    model.eval()
    return {"model": model, "tokenizer": tokenizer}


def input_fn(request_body: str, request_content_type: str = "application/json"):
    """Parse input data from the request."""
    if request_content_type != "application/json":
        raise ValueError(f"Unsupported content type: {request_content_type}")

    data = json.loads(request_body)
    if isinstance(data, str):
        return {"texts": [data]}
    if isinstance(data, list):
        return {"texts": data}
    if isinstance(data, dict) and "text" in data:
        texts = data["text"] if isinstance(data["text"], list) else [data["text"]]
        return {"texts": texts}
    raise ValueError(f"Unsupported input format: {type(data)}")


def predict_fn(input_data: dict, model_artifacts: dict):
    """Run inference on the input data."""
    model = model_artifacts["model"]
    tokenizer = model_artifacts["tokenizer"]
    texts = input_data["texts"]

    encodings = tokenizer(
        texts,
        padding="max_length",
        truncation=True,
        max_length=MAX_SEQ_LENGTH,
        return_tensors="pt",
    ).to(device)

    with torch.no_grad():
        outputs = model(**encodings)
        probs = torch.softmax(outputs.logits, dim=-1)
        predictions = torch.argmax(probs, dim=-1)

    results = []
    for i, text in enumerate(texts):
        pred_label = predictions[i].item()
        results.append(
            {
                "text": text[:100] + "..." if len(text) > 100 else text,
                "predicted_label": pred_label,
                "predicted_class": LABEL_MAP[pred_label],
                "confidence": round(probs[i][pred_label].item(), 4),
                "probabilities": {
                    LABEL_MAP[j]: round(probs[i][j].item(), 4)
                    for j in range(len(LABEL_MAP))
                },
            }
        )

    return results


def output_fn(prediction, response_content_type: str = "application/json"):
    """Format the prediction output."""
    if response_content_type == "application/json":
        return json.dumps(prediction, indent=2)
    raise ValueError(f"Unsupported response content type: {response_content_type}")


if __name__ == "__main__":
    model_dir = os.environ.get("MODEL_DIR", "models/latest")

    artifacts = model_fn(model_dir)

    test_texts = [
        "The stock market rallied today as tech companies reported strong earnings.",
        "The Lakers defeated the Celtics in overtime 112-108.",
        "Scientists discover new species in the deep ocean using AI-powered cameras.",
        "Global leaders meet at UN summit to discuss climate change policies.",
    ]

    input_data = input_fn(json.dumps(test_texts))
    results = predict_fn(input_data, artifacts)
    output = output_fn(results)

    logger.info("Inference results:\n%s", output)
