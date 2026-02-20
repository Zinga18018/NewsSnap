# ──────────────────────────────────────────────
# Outputs
# ──────────────────────────────────────────────

output "s3_bucket_data" {
  description = "S3 bucket for training data"
  value       = aws_s3_bucket.data.id
}

output "s3_bucket_models" {
  description = "S3 bucket for trained models"
  value       = aws_s3_bucket.models.id
}

output "s3_bucket_metrics" {
  description = "S3 bucket for metrics (public read for dashboard)"
  value       = aws_s3_bucket.metrics.id
}

output "s3_metrics_url" {
  description = "Public URL for metrics bucket"
  value       = "https://${aws_s3_bucket.metrics.bucket_regional_domain_name}/public"
}

output "ecr_repository_url" {
  description = "ECR repository URL for training images"
  value       = aws_ecr_repository.training.repository_url
}

output "sagemaker_role_arn" {
  description = "SageMaker execution role ARN"
  value       = aws_iam_role.sagemaker_execution.arn
}

output "lambda_function_arn" {
  description = "Pipeline trigger Lambda ARN"
  value       = aws_lambda_function.pipeline_trigger.arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.mlops.dashboard_name}"
}
