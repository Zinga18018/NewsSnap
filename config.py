"""
LLMOPS Configuration
Loads all settings from environment variables with sensible defaults.
Validates critical settings on load to fail fast on configuration errors.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from src.utils.logging_config import setup_logging

# Load .env file if present
load_dotenv()
logger = setup_logging(__name__)

# ──────────────────────────────────────────────
# Configuration Validation
# ──────────────────────────────────────────────
def _validate_config():
    """Validate critical configuration on startup."""
    from src.utils.validation import (
        validate_numeric_range, ValidationError
    )
    
    try:
        # Validate numeric configs
        validate_numeric_range(
            os.getenv("NUM_LABELS", "4"),
            min_val=1, max_val=100, name="NUM_LABELS"
        )
        validate_numeric_range(
            os.getenv("MAX_SEQ_LENGTH", "128"),
            min_val=50, max_val=512, name="MAX_SEQ_LENGTH"
        )
        validate_numeric_range(
            os.getenv("BATCH_SIZE", "32"),
            min_val=1, max_val=256, name="BATCH_SIZE"
        )
        validate_numeric_range(
            os.getenv("LEARNING_RATE", "2e-5"),
            min_val=1e-6, max_val=1.0, name="LEARNING_RATE"
        )
        validate_numeric_range(
            os.getenv("NUM_EPOCHS", "3"),
            min_val=1, max_val=100, name="NUM_EPOCHS"
        )
    except ValidationError as e:
        logger.warning("Configuration validation warning: %s", e)
        # Continue with defaults rather than crash
    except Exception as e:
        logger.warning("Configuration validation error: %s", e)

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"

# ──────────────────────────────────────────────
# AWS
# ──────────────────────────────────────────────
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# S3
S3_BUCKET_DATA = os.getenv("S3_BUCKET_DATA", "llmop-ml-data-dev")
S3_BUCKET_MODELS = os.getenv("S3_BUCKET_MODELS", "llmop-ml-models-dev")
S3_BUCKET_METRICS = os.getenv("S3_BUCKET_METRICS", "llmop-ml-metrics-dev")

# SageMaker
SAGEMAKER_ROLE_ARN = os.getenv("SAGEMAKER_ROLE_ARN", "")
SAGEMAKER_INSTANCE_TYPE = os.getenv("SAGEMAKER_INSTANCE_TYPE", "ml.m5.large")

# ECR
ECR_REPOSITORY = os.getenv("ECR_REPOSITORY", "public.ecr.aws/b3e7b0p8/llmop")

# ──────────────────────────────────────────────
# Model Configuration
# ──────────────────────────────────────────────
MODEL_NAME = os.getenv("MODEL_NAME", "distilbert-base-uncased")
NUM_LABELS = int(os.getenv("NUM_LABELS", "4"))
MAX_SEQ_LENGTH = int(os.getenv("MAX_SEQ_LENGTH", "128"))

# ──────────────────────────────────────────────
# Training Hyperparameters
# ──────────────────────────────────────────────
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", "2e-5"))
NUM_EPOCHS = int(os.getenv("NUM_EPOCHS", "3"))

# ──────────────────────────────────────────────
# Project Metadata
# ──────────────────────────────────────────────
PROJECT_NAME = os.getenv("PROJECT_NAME", "llmops-agnews")
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")

# AG News label mapping
LABEL_MAP = {
    0: "World",
    1: "Sports",
    2: "Business",
    3: "Sci/Tech",
}

# Validate configuration on import
_validate_config()
