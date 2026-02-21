# ──────────────────────────────────────────────
# SageMaker Resources
# ──────────────────────────────────────────────

# Note: SageMaker training jobs are created dynamically via
# the SageMaker Python SDK or Lambda. Terraform manages the
# static infrastructure (model, endpoint config, endpoint).

# ─── PHASE 2: Uncomment after pushing Docker image to ECR ───
# These resources require a valid Docker image in ECR to create.
# Push your image first, then uncomment and re-run terraform apply.

# resource "aws_sagemaker_model" "classifier" {
#   name               = "${var.project_name}-classifier-${var.environment}"
#   execution_role_arn = aws_iam_role.sagemaker_execution.arn
#
#   primary_container {
#     image          = "${aws_ecr_repository.training.repository_url}:latest"
#     model_data_url = "s3://${aws_s3_bucket.models.id}/latest/model.tar.gz"
#   }
#
#   tags = {
#     Purpose = "Text classification model"
#   }
#
#   lifecycle {
#     ignore_changes = [primary_container[0].model_data_url]
#   }
# }

# resource "aws_sagemaker_endpoint_configuration" "classifier" {
#   name = "${var.project_name}-endpoint-config-${var.environment}"
#
#   production_variants {
#     variant_name           = "primary"
#     model_name             = aws_sagemaker_model.classifier.name
#     initial_instance_count = 1
#     instance_type          = var.sagemaker_endpoint_instance_type
#     initial_variant_weight = 1.0
#   }
#
#   tags = {
#     Purpose = "Classifier endpoint configuration"
#   }
# }

# resource "aws_sagemaker_endpoint" "classifier" {
#   name                 = "${var.project_name}-endpoint-${var.environment}"
#   endpoint_config_name = aws_sagemaker_endpoint_configuration.classifier.name
#
#   tags = {
#     Purpose = "Live inference endpoint"
#   }
# }
