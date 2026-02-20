"""
Trigger Training — CLI Script
Manually triggers a SageMaker training job or runs training locally via Docker.
"""

import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config
from src.utils.aws_helpers import create_sagemaker_training_job, get_training_job_status


def trigger_local(data_dir: str = "data/processed", model_dir: str = "models/latest"):
    """Run training locally using Docker."""
    print("[Trigger] Running training locally via Docker...")

    cmd = [
        "docker", "run", "--rm",
        "-v", f"{os.path.abspath(data_dir)}:/opt/ml/input/data/training",
        "-v", f"{os.path.abspath(model_dir)}:/opt/ml/model",
        "-e", f"SM_CHANNEL_TRAINING=/opt/ml/input/data/training",
        "-e", f"SM_MODEL_DIR=/opt/ml/model",
        "-e", f"SM_NUM_GPUS=0",
        "llmops-training:latest",
    ]

    print(f"[Trigger] Command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)

    if result.returncode == 0:
        print("[Trigger] Local training completed successfully!")
    else:
        print(f"[Trigger] Training failed with exit code {result.returncode}")
        sys.exit(1)


def trigger_sagemaker(image_uri: str = None):
    """Trigger a SageMaker training job."""
    print("[Trigger] Submitting SageMaker training job...")

    # Get ECR image URI
    if image_uri is None:
        account_id = os.popen("aws sts get-caller-identity --query Account --output text").read().strip()
        image_uri = f"{account_id}.dkr.ecr.{config.AWS_REGION}.amazonaws.com/{config.ECR_REPOSITORY}:latest"

    result = create_sagemaker_training_job(image_uri=image_uri)
    print(f"[Trigger] Training job submitted: {result['job_name']}")
    print(f"[Trigger] Monitor at: https://{config.AWS_REGION}.console.aws.amazon.com/sagemaker/home?region={config.AWS_REGION}#/jobs/{result['job_name']}")

    return result


def main():
    parser = argparse.ArgumentParser(description="Trigger ML training")
    parser.add_argument("--mode", choices=["local", "sagemaker"], default="local",
                        help="Training mode: local Docker or SageMaker")
    parser.add_argument("--data-dir", default="data/processed",
                        help="Local data directory (for local mode)")
    parser.add_argument("--model-dir", default="models/latest",
                        help="Local model output directory (for local mode)")
    parser.add_argument("--image-uri", default=None,
                        help="ECR image URI (for SageMaker mode)")
    args = parser.parse_args()

    if args.mode == "local":
        trigger_local(args.data_dir, args.model_dir)
    else:
        trigger_sagemaker(args.image_uri)


if __name__ == "__main__":
    main()
