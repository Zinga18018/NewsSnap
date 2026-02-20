"""
Data Ingestion Module
Downloads AG News dataset from HuggingFace and optionally from S3.
"""

import json
import os
from pathlib import Path

from datasets import load_dataset

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import config


def load_ag_news(split: str = "train") -> dict:
    """
    Load AG News dataset from HuggingFace Hub.

    Args:
        split: 'train' or 'test'

    Returns:
        HuggingFace Dataset object
    """
    print(f"[Ingestion] Loading AG News ({split}) from HuggingFace...")
    dataset = load_dataset("ag_news", split=split)
    print(f"[Ingestion] Loaded {len(dataset)} samples")
    return dataset


def download_from_s3(s3_key: str, local_path: str, bucket: str = None) -> str:
    """
    Download a file from S3 to local path.

    Args:
        s3_key: S3 object key
        local_path: Local file path to save to
        bucket: S3 bucket name (defaults to config)

    Returns:
        Local file path
    """
    import boto3

    bucket = bucket or config.S3_BUCKET_DATA
    s3 = boto3.client("s3", region_name=config.AWS_REGION)

    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    print(f"[Ingestion] Downloading s3://{bucket}/{s3_key} → {local_path}")
    s3.download_file(bucket, s3_key, local_path)
    return local_path


def upload_to_s3(local_path: str, s3_key: str, bucket: str = None) -> str:
    """
    Upload a local file to S3.

    Args:
        local_path: Local file path
        s3_key: S3 object key
        bucket: S3 bucket name (defaults to config)

    Returns:
        S3 URI
    """
    import boto3

    bucket = bucket or config.S3_BUCKET_DATA
    s3 = boto3.client("s3", region_name=config.AWS_REGION)

    print(f"[Ingestion] Uploading {local_path} → s3://{bucket}/{s3_key}")
    s3.upload_file(local_path, bucket, s3_key)
    return f"s3://{bucket}/{s3_key}"


def save_dataset_locally(dataset, output_dir: str, split: str = "train") -> str:
    """
    Save a HuggingFace dataset as JSONL file locally.

    Args:
        dataset: HuggingFace Dataset
        output_dir: Output directory
        split: Dataset split name

    Returns:
        Path to saved file
    """
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, f"ag_news_{split}.jsonl")

    with open(filepath, "w", encoding="utf-8") as f:
        for sample in dataset:
            json.dump({
                "text": sample["text"],
                "label": sample["label"],
                "label_name": config.LABEL_MAP[sample["label"]],
            }, f)
            f.write("\n")

    print(f"[Ingestion] Saved {len(dataset)} samples to {filepath}")
    return filepath


def ingest_pipeline(output_dir: str = None) -> dict:
    """
    Full ingestion pipeline: download AG News → save locally → upload to S3.

    Returns:
        Dict with local file paths and S3 URIs
    """
    output_dir = output_dir or str(config.DATA_DIR / "raw")
    results = {}

    for split in ["train", "test"]:
        dataset = load_ag_news(split)
        local_path = save_dataset_locally(dataset, output_dir, split)
        results[split] = {"local_path": local_path, "count": len(dataset)}

        # Upload to S3 if credentials are available
        if config.AWS_ACCESS_KEY_ID:
            try:
                s3_uri = upload_to_s3(local_path, f"raw/ag_news_{split}.jsonl")
                results[split]["s3_uri"] = s3_uri
            except Exception as e:
                print(f"[Ingestion] S3 upload skipped: {e}")

    return results


if __name__ == "__main__":
    results = ingest_pipeline()
    print("\n[Ingestion] Complete!")
    for split, info in results.items():
        print(f"  {split}: {info['count']} samples → {info['local_path']}")
