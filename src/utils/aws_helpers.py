"""
AWS Helper Utilities
Wrappers for common S3, ECR, and SageMaker operations.
"""

import json
import os
import sys
import tarfile
import tempfile
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    import config
except ImportError:
    config = None


def get_s3_client():
    """Get an S3 client with configured credentials."""
    return boto3.client("s3", region_name=getattr(config, "AWS_REGION", "us-east-1"))


def get_sagemaker_client():
    """Get a SageMaker client."""
    return boto3.client("sagemaker", region_name=getattr(config, "AWS_REGION", "us-east-1"))


def upload_file_to_s3(local_path: str, bucket: str, s3_key: str) -> str:
    """Upload a file to S3. Returns the S3 URI."""
    s3 = get_s3_client()
    s3.upload_file(local_path, bucket, s3_key)
    uri = f"s3://{bucket}/{s3_key}"
    print(f"[AWS] Uploaded {local_path} → {uri}")
    return uri


def download_file_from_s3(bucket: str, s3_key: str, local_path: str) -> str:
    """Download a file from S3. Returns local path."""
    s3 = get_s3_client()
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    s3.download_file(bucket, s3_key, local_path)
    print(f"[AWS] Downloaded s3://{bucket}/{s3_key} → {local_path}")
    return local_path


def list_s3_objects(bucket: str, prefix: str = "") -> list:
    """List objects in an S3 bucket with optional prefix."""
    s3 = get_s3_client()
    response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    objects = response.get("Contents", [])
    return [{"key": obj["Key"], "size": obj["Size"], "modified": str(obj["LastModified"])} for obj in objects]


def create_model_tarball(model_dir: str, output_path: str = None) -> str:
    """
    Package a model directory into a tar.gz for SageMaker.
    SageMaker expects model artifacts as model.tar.gz.
    """
    if output_path is None:
        output_path = os.path.join(tempfile.gettempdir(), "model.tar.gz")

    with tarfile.open(output_path, "w:gz") as tar:
        for item in os.listdir(model_dir):
            tar.add(os.path.join(model_dir, item), arcname=item)

    print(f"[AWS] Created model tarball: {output_path}")
    return output_path


def upload_model_to_s3(model_dir: str, bucket: str = None, prefix: str = "latest") -> str:
    """Package and upload a model to S3."""
    bucket = bucket or getattr(config, "S3_BUCKET_MODELS", "llmops-ml-models-dev")

    tarball_path = create_model_tarball(model_dir)
    s3_key = f"{prefix}/model.tar.gz"
    s3_uri = upload_file_to_s3(tarball_path, bucket, s3_key)

    # Clean up temp file
    os.remove(tarball_path)
    return s3_uri


def create_sagemaker_training_job(
    job_name: str = None,
    image_uri: str = None,
    role_arn: str = None,
    input_s3_uri: str = None,
    output_s3_uri: str = None,
    instance_type: str = None,
    hyperparameters: dict = None,
) -> dict:
    """
    Create a SageMaker training job.

    Returns:
        Dict with job details
    """
    sm = get_sagemaker_client()

    job_name = job_name or f"llmops-training-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    role_arn = role_arn or getattr(config, "SAGEMAKER_ROLE_ARN", "")
    instance_type = instance_type or getattr(config, "SAGEMAKER_INSTANCE_TYPE", "ml.m5.large")
    data_bucket = getattr(config, "S3_BUCKET_DATA", "llmops-ml-data-dev")
    models_bucket = getattr(config, "S3_BUCKET_MODELS", "llmops-ml-models-dev")
    ecr_repo = getattr(config, "ECR_REPOSITORY", "llmops-training")

    input_s3_uri = input_s3_uri or f"s3://{data_bucket}/processed/"
    output_s3_uri = output_s3_uri or f"s3://{models_bucket}/training-output/"

    default_hyperparameters = {
        "model_name": getattr(config, "MODEL_NAME", "distilbert-base-uncased"),
        "num_labels": str(getattr(config, "NUM_LABELS", 4)),
        "epochs": str(getattr(config, "NUM_EPOCHS", 3)),
        "batch_size": str(getattr(config, "BATCH_SIZE", 32)),
        "learning_rate": str(getattr(config, "LEARNING_RATE", 2e-5)),
    }
    if hyperparameters:
        default_hyperparameters.update(hyperparameters)

    response = sm.create_training_job(
        TrainingJobName=job_name,
        RoleArn=role_arn,
        AlgorithmSpecification={
            "TrainingImage": image_uri,
            "TrainingInputMode": "File",
        },
        InputDataConfig=[{
            "ChannelName": "training",
            "DataSource": {
                "S3DataSource": {
                    "S3DataType": "S3Prefix",
                    "S3Uri": input_s3_uri,
                    "S3DataDistributionType": "FullyReplicated",
                }
            },
            "ContentType": "application/json",
        }],
        OutputDataConfig={"S3OutputPath": output_s3_uri},
        ResourceConfig={
            "InstanceType": instance_type,
            "InstanceCount": 1,
            "VolumeSizeInGB": 30,
        },
        StoppingCondition={"MaxRuntimeInSeconds": 7200},
        HyperParameters=default_hyperparameters,
    )

    print(f"[AWS] Created training job: {job_name}")
    return {"job_name": job_name, "response": response}


def get_training_job_status(job_name: str) -> dict:
    """Get the status of a SageMaker training job."""
    sm = get_sagemaker_client()
    response = sm.describe_training_job(TrainingJobName=job_name)
    return {
        "job_name": job_name,
        "status": response["TrainingJobStatus"],
        "secondary_status": response.get("SecondaryStatus", ""),
        "creation_time": str(response.get("CreationTime", "")),
        "training_time": response.get("TrainingTimeInSeconds", 0),
    }
