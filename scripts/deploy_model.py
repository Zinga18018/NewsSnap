"""
Deploy Model — CLI Script
Deploys a trained model to a SageMaker endpoint.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config
from src.utils.aws_helpers import upload_model_to_s3, get_s3_client

import boto3


def deploy_to_sagemaker(model_dir: str, endpoint_name: str = None):
    """
    Package model, upload to S3, and create/update a SageMaker endpoint.
    """
    endpoint_name = endpoint_name or f"{config.PROJECT_NAME}-endpoint-{config.ENVIRONMENT}"

    print(f"[Deploy] Packaging and uploading model from {model_dir}...")
    model_s3_uri = upload_model_to_s3(model_dir)
    print(f"[Deploy] Model uploaded to {model_s3_uri}")

    sm = boto3.client("sagemaker", region_name=config.AWS_REGION)

    # Check if endpoint exists
    try:
        sm.describe_endpoint(EndpointName=endpoint_name)
        exists = True
        print(f"[Deploy] Endpoint '{endpoint_name}' exists, will update")
    except sm.exceptions.ClientError:
        exists = False
        print(f"[Deploy] Creating new endpoint '{endpoint_name}'")

    # Create model
    model_name = f"{config.PROJECT_NAME}-model-{config.ENVIRONMENT}"
    account_id = boto3.client("sts").get_caller_identity()["Account"]
    image_uri = f"{account_id}.dkr.ecr.{config.AWS_REGION}.amazonaws.com/{config.ECR_REPOSITORY}:latest"

    try:
        sm.delete_model(ModelName=model_name)
    except Exception:
        pass

    sm.create_model(
        ModelName=model_name,
        PrimaryContainer={
            "Image": image_uri,
            "ModelDataUrl": model_s3_uri,
        },
        ExecutionRoleArn=config.SAGEMAKER_ROLE_ARN,
    )
    print(f"[Deploy] Created SageMaker model: {model_name}")

    # Create endpoint config
    endpoint_config_name = f"{config.PROJECT_NAME}-config-{config.ENVIRONMENT}"
    try:
        sm.delete_endpoint_config(EndpointConfigName=endpoint_config_name)
    except Exception:
        pass

    sm.create_endpoint_config(
        EndpointConfigName=endpoint_config_name,
        ProductionVariants=[{
            "VariantName": "primary",
            "ModelName": model_name,
            "InstanceType": config.SAGEMAKER_INSTANCE_TYPE,
            "InitialInstanceCount": 1,
            "InitialVariantWeight": 1.0,
        }],
    )
    print(f"[Deploy] Created endpoint config: {endpoint_config_name}")

    # Create or update endpoint
    if exists:
        sm.update_endpoint(
            EndpointName=endpoint_name,
            EndpointConfigName=endpoint_config_name,
        )
        print(f"[Deploy] Updating endpoint: {endpoint_name}")
    else:
        sm.create_endpoint(
            EndpointName=endpoint_name,
            EndpointConfigName=endpoint_config_name,
        )
        print(f"[Deploy] Creating endpoint: {endpoint_name}")

    print(f"[Deploy] Endpoint deploying... This takes 5-10 minutes.")
    print(f"[Deploy] Monitor at: https://{config.AWS_REGION}.console.aws.amazon.com/sagemaker/home?region={config.AWS_REGION}#/endpoints/{endpoint_name}")


def main():
    parser = argparse.ArgumentParser(description="Deploy model to SageMaker endpoint")
    parser.add_argument("--model-dir", default="models/latest",
                        help="Local model directory to deploy")
    parser.add_argument("--endpoint-name", default=None,
                        help="SageMaker endpoint name")
    args = parser.parse_args()

    deploy_to_sagemaker(args.model_dir, args.endpoint_name)


if __name__ == "__main__":
    main()
