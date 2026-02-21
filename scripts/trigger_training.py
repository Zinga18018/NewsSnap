"""Trigger model training locally or on SageMaker.

Default mode is local Python training (no Docker, no SageMaker required).
"""

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config
from src.utils.aws_helpers import create_sagemaker_training_job


def trigger_local_python(data_dir: str = "data/processed", model_dir: str = "models/latest"):
    """Run training locally with Python."""
    cmd = [
        sys.executable,
        "-m",
        "src.models.train",
        "--data-dir",
        data_dir,
        "--model-dir",
        model_dir,
    ]
    print(f"[Trigger] Running local Python training: {' '.join(cmd)}")
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def trigger_local_docker(data_dir: str = "data/processed", model_dir: str = "models/latest"):
    """Run training locally using Docker image."""
    cmd = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{os.path.abspath(data_dir)}:/opt/ml/input/data/training",
        "-v",
        f"{os.path.abspath(model_dir)}:/opt/ml/model",
        "-e",
        "SM_CHANNEL_TRAINING=/opt/ml/input/data/training",
        "-e",
        "SM_MODEL_DIR=/opt/ml/model",
        "-e",
        "SM_NUM_GPUS=0",
        "llmops-training:latest",
    ]

    print(f"[Trigger] Running local Docker training: {' '.join(cmd)}")
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def trigger_sagemaker(image_uri: str = None):
    """Trigger a SageMaker training job."""
    print("[Trigger] Submitting SageMaker training job...")

    if image_uri is None:
        account_id = os.popen("aws sts get-caller-identity --query Account --output text").read().strip()
        image_uri = f"{account_id}.dkr.ecr.{config.AWS_REGION}.amazonaws.com/{config.ECR_REPOSITORY}:latest"

    result = create_sagemaker_training_job(image_uri=image_uri)
    print(f"[Trigger] Training job submitted: {result['job_name']}")
    print(
        "[Trigger] Monitor: "
        f"https://{config.AWS_REGION}.console.aws.amazon.com/sagemaker/home?region={config.AWS_REGION}#/jobs/{result['job_name']}"
    )
    return result


def main():
    parser = argparse.ArgumentParser(description="Trigger ML training")
    parser.add_argument(
        "--mode",
        choices=["local-python", "local-docker", "sagemaker"],
        default="local-python",
        help="Training mode",
    )
    parser.add_argument("--data-dir", default="data/processed", help="Local data directory")
    parser.add_argument("--model-dir", default="models/latest", help="Local model output directory")
    parser.add_argument("--image-uri", default=None, help="ECR image URI (SageMaker mode)")
    args = parser.parse_args()

    if args.mode == "local-python":
        trigger_local_python(args.data_dir, args.model_dir)
    elif args.mode == "local-docker":
        trigger_local_docker(args.data_dir, args.model_dir)
    else:
        trigger_sagemaker(args.image_uri)


if __name__ == "__main__":
    main()
