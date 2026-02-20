# ──────────────────────────────────────────────
# Main — Root Module
# ──────────────────────────────────────────────
# All resources are defined in their respective files:
#   - s3.tf         → S3 buckets (data, models, metrics)
#   - ecr.tf        → ECR repository
#   - iam.tf        → IAM roles & policies
#   - sagemaker.tf  → SageMaker model & endpoint config
#   - lambda.tf     → Pipeline trigger Lambda
#   - cloudwatch.tf → Monitoring, alarms, dashboard
#
# This file serves as documentation and can hold
# data sources or locals shared across resources.

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Naming convention: {project}-{resource}-{environment}
  name_prefix = "${var.project_name}-${var.environment}"
}
