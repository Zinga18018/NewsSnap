"""
SageMaker Endpoint Deployment Script
Deploys a trained DistilBERT model from S3 to a SageMaker real-time endpoint.
"""

import os
import argparse
import boto3
import sagemaker
from sagemaker.pytorch import PyTorchModel
from dotenv import load_dotenv

load_dotenv()

def deploy_model(model_data, role, image_uri, instance_type="ml.t2.medium"):
    """
    Deploy the model to a SageMaker endpoint.
    """
    print(f"[*] Deploying model from {model_data}")
    print(f"[*] Using role: {role}")
    print(f"[*] Using image: {image_uri}")

    sagemaker_session = sagemaker.Session()

    pytorch_model = PyTorchModel(
        model_data=model_data,
        role=role,
        image_uri=image_uri,
        entry_point="src/serving/inference.py",
        source_dir=".",
        framework_version="2.1.0",
        py_version="py310",
        name="llmop-distilbert-model"
    )

    print("[*] Starting deployment...")
    predictor = pytorch_model.deploy(
        initial_instance_count=1,
        instance_type=instance_type,
        endpoint_name="llmop-distilbert-endpoint",
        serializer=sagemaker.serializers.JSONSerializer(),
        deserializer=sagemaker.deserializers.JSONDeserializer()
    )

    print(f"[+] Successfully deployed to endpoint: {predictor.endpoint_name}")
    return predictor.endpoint_name

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_s3", type=str, help="S3 URI of the model.tar.gz")
    parser.add_argument("--instance_type", type=str, default="ml.t2.medium", help="SageMaker instance type")
    args = parser.parse_args()

    # Get from environment if not provided
    model_s3 = args.model_s3 or os.environ.get("MODEL_S3_PATH")
    role = os.environ.get("SAGEMAKER_ROLE_ARN")
    image_uri = os.environ.get("ECR_REPOSITORY_URL")

    if not all([model_s3, role, image_uri]):
        print("[!] Error: Missing model_s3, SAGEMAKER_ROLE_ARN, or ECR_REPOSITORY_URL")
        exit(1)

    deploy_model(model_s3, role, image_uri, args.instance_type)
