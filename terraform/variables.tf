# ──────────────────────────────────────────────
# General
# ──────────────────────────────────────────────
variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
  default     = "llmop"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

# ──────────────────────────────────────────────
# S3
# ──────────────────────────────────────────────
variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names (must be globally unique)"
  type        = string
  default     = "llmop-ml"
}

# ──────────────────────────────────────────────
# SageMaker
# ──────────────────────────────────────────────
variable "sagemaker_instance_type" {
  description = "EC2 instance type for SageMaker training jobs"
  type        = string
  default     = "ml.m5.large"
}

variable "sagemaker_endpoint_instance_type" {
  description = "EC2 instance type for SageMaker endpoints"
  type        = string
  default     = "ml.m5.large"
}

variable "model_name" {
  description = "HuggingFace model identifier"
  type        = string
  default     = "distilbert-base-uncased"
}

variable "num_labels" {
  description = "Number of classification labels"
  type        = number
  default     = 4
}
