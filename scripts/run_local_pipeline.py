"""Run the complete local pipeline without SageMaker.

Steps:
1. Ingest data from HuggingFace (only if raw files missing or --force)
2. Preprocess into train/val/test (only if processed files missing or --force)
3. Train model locally into models/latest
4. Evaluate model and write metrics locally
"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.data.ingestion import ingest_pipeline
from src.data.preprocessing import preprocess_pipeline
from src.models.evaluate import evaluate_model
from src.models.train import train
from src.utils.logging_config import setup_logging

logger = setup_logging(__name__)


def _raw_data_exists(raw_dir: Path) -> bool:
    return (raw_dir / "ag_news_train.jsonl").exists() and (raw_dir / "ag_news_test.jsonl").exists()


def _processed_data_exists(processed_dir: Path) -> bool:
    required = ["train.jsonl", "val.jsonl", "test.jsonl"]
    return all((processed_dir / name).exists() for name in required)


def run(args) -> None:
    raw_dir = Path(args.raw_dir)
    processed_dir = Path(args.data_dir)
    model_dir = Path(args.model_dir)

    if args.skip_ingestion:
        logger.info("Skipping ingestion (flag set)")
    elif args.force or not _raw_data_exists(raw_dir):
        logger.info("Running ingestion step")
        ingest_pipeline(output_dir=str(raw_dir))
    else:
        logger.info("Raw data already exists, skipping ingestion")

    if args.skip_preprocessing:
        logger.info("Skipping preprocessing (flag set)")
    elif args.force or not _processed_data_exists(processed_dir):
        logger.info("Running preprocessing step")
        preprocess_pipeline(input_dir=str(raw_dir), output_dir=str(processed_dir))
    else:
        logger.info("Processed data already exists, skipping preprocessing")

    if args.skip_training:
        logger.info("Skipping training (flag set)")
    else:
        os.makedirs(model_dir, exist_ok=True)
        logger.info("Running local training")
        train(args)

    if args.skip_evaluation:
        logger.info("Skipping evaluation (flag set)")
    else:
        logger.info("Running evaluation")
        test_data = args.test_data or str(processed_dir / "test.jsonl")
        results = evaluate_model(
            model_dir=str(model_dir),
            test_data_path=test_data,
            output_dir=str(model_dir),
            batch_size=args.batch_size,
            max_length=args.max_seq_length,
        )
        logger.info("Evaluation complete. Accuracy=%.4f", results["metrics"]["accuracy"])

    logger.info("Local pipeline finished")


def parse_args():
    parser = argparse.ArgumentParser(description="Run local end-to-end pipeline")
    parser.add_argument("--raw-dir", default="data/raw", help="Raw data directory")
    parser.add_argument("--data-dir", default="data/processed", help="Processed data directory")
    parser.add_argument("--model-dir", default="models/latest", help="Model output directory")
    parser.add_argument("--test-data", default=None, help="Override test JSONL path")

    parser.add_argument("--model-name", default="distilbert-base-uncased")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--max-seq-length", type=int, default=128)

    parser.add_argument("--max-train-samples", type=int, default=3000,
                        help="Cap train samples for local runs (0 for full)")
    parser.add_argument("--max-val-samples", type=int, default=600,
                        help="Cap val samples for local runs (0 for full)")
    parser.add_argument("--random-state", type=int, default=42)

    parser.add_argument("--skip-ingestion", action="store_true")
    parser.add_argument("--skip-preprocessing", action="store_true")
    parser.add_argument("--skip-training", action="store_true")
    parser.add_argument("--skip-evaluation", action="store_true")
    parser.add_argument("--force", action="store_true",
                        help="Force rerun ingestion and preprocessing even if files exist")

    return parser.parse_args()


if __name__ == "__main__":
    run(parse_args())
