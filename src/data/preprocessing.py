"""Data preprocessing pipeline for AG News model training."""

import json
import os
import sys

import pandas as pd
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import config
from src.utils.logging_config import setup_logging

logger = setup_logging(__name__)


def load_jsonl(filepath: str) -> pd.DataFrame:
    """Load JSONL file into a pandas DataFrame."""
    records = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line.strip()))
    return pd.DataFrame(records)


def clean_text(text: str) -> str:
    """Basic text cleaning for news articles."""
    if not isinstance(text, str):
        return ""
    text = " ".join(text.split())
    if len(text) < 10:
        return ""
    return text


def tokenize_dataset(texts: list, tokenizer, max_length: int = None) -> dict:
    """
    Tokenize a list of texts using a HuggingFace tokenizer.

    Args:
        texts: List of text strings
        tokenizer: HuggingFace tokenizer
        max_length: Max sequence length (defaults to config)

    Returns:
        Dict with input_ids, attention_mask
    """
    max_length = max_length or config.MAX_SEQ_LENGTH

    encodings = tokenizer(
        texts,
        padding="max_length",
        truncation=True,
        max_length=max_length,
        return_tensors="pt",
    )

    return {
        "input_ids": encodings["input_ids"],
        "attention_mask": encodings["attention_mask"],
    }


def create_splits(
    df: pd.DataFrame,
    val_size: float = 0.1,
    test_size: float = 0.1,
    random_state: int = 42,
) -> tuple:
    """
    Split data into train/val/test sets with stratification.

    Args:
        df: DataFrame with 'text' and 'label' columns
        val_size: Validation set proportion
        test_size: Test set proportion
        random_state: Random seed

    Returns:
        Tuple of (train_df, val_df, test_df)
    """
    train_val_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=random_state,
        stratify=df["label"],
    )

    relative_val_size = val_size / (1 - test_size)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=relative_val_size,
        random_state=random_state,
        stratify=train_val_df["label"],
    )

    logger.info(
        "Created splits: train=%d val=%d test=%d",
        len(train_df),
        len(val_df),
        len(test_df),
    )
    return train_df, val_df, test_df


def preprocess_pipeline(input_dir: str = None, output_dir: str = None) -> dict:
    """
    Full preprocessing pipeline:
    1. Load raw JSONL data
    2. Clean text
    3. Create train/val/test splits
    4. Tokenize
    5. Save processed data

    Returns:
        Dict with split info and file paths
    """
    input_dir = input_dir or str(config.DATA_DIR / "raw")
    output_dir = output_dir or str(config.DATA_DIR / "processed")
    os.makedirs(output_dir, exist_ok=True)

    train_path = os.path.join(input_dir, "ag_news_train.jsonl")
    df = load_jsonl(train_path)
    logger.info("Loaded %d raw samples from %s", len(df), train_path)

    df["text"] = df["text"].apply(clean_text)
    df = df[df["text"].str.len() > 0].reset_index(drop=True)
    logger.info("After cleaning: %d samples", len(df))

    train_df, val_df, test_df = create_splits(df)

    results = {}
    for split_name, split_df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        filepath = os.path.join(output_dir, f"{split_name}.jsonl")
        split_df.to_json(filepath, orient="records", lines=True)
        results[split_name] = {"path": filepath, "count": len(split_df)}
        logger.info("Saved %s split: %d samples -> %s", split_name, len(split_df), filepath)

    tokenizer = AutoTokenizer.from_pretrained(config.MODEL_NAME)
    tokenizer_path = os.path.join(output_dir, "tokenizer")
    tokenizer.save_pretrained(tokenizer_path)
    logger.info("Tokenizer saved to %s", tokenizer_path)

    if config.AWS_ACCESS_KEY_ID:
        try:
            from src.data.ingestion import upload_to_s3

            for split_name, info in results.items():
                s3_uri = upload_to_s3(info["path"], f"processed/{split_name}.jsonl")
                results[split_name]["s3_uri"] = s3_uri
        except Exception as exc:
            logger.warning("S3 upload skipped: %s", exc)

    return results


if __name__ == "__main__":
    pipeline_results = preprocess_pipeline()
    logger.info("Preprocessing complete")
    for split, info in pipeline_results.items():
        logger.info("%s: %d samples", split, info["count"])
