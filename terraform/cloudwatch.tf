# ──────────────────────────────────────────────
# CloudWatch Monitoring & Alarms
# ──────────────────────────────────────────────

# Log group for SageMaker training jobs
resource "aws_cloudwatch_log_group" "sagemaker_training" {
  name              = "/aws/sagemaker/TrainingJobs/${var.project_name}"
  retention_in_days = 30

  tags = {
    Purpose = "SageMaker training job logs"
  }
}

# Log group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.pipeline_trigger.function_name}"
  retention_in_days = 14

  tags = {
    Purpose = "Pipeline trigger Lambda logs"
  }
}

# Custom metric namespace for ML metrics
# (metrics are pushed from training script via boto3)

# Alarm: Training job failure
resource "aws_cloudwatch_metric_alarm" "training_failure" {
  alarm_name          = "${var.project_name}-training-failure-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrainingFailure"
  namespace           = "${var.project_name}/MLPipeline"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarm when a SageMaker training job fails"
  treat_missing_data  = "notBreaching"

  tags = {
    Purpose = "Alert on training failures"
  }
}

# Alarm: Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarm when pipeline trigger Lambda has errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.pipeline_trigger.function_name
  }

  tags = {
    Purpose = "Alert on Lambda trigger failures"
  }
}

# Dashboard
resource "aws_cloudwatch_dashboard" "mlops" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Invocations"
          metrics = [["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.pipeline_trigger.function_name]]
          period  = 300
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Errors"
          metrics = [["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.pipeline_trigger.function_name]]
          period  = 300
          region  = var.aws_region
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          title   = "SageMaker Training Logs"
          query   = "SOURCE '${aws_cloudwatch_log_group.sagemaker_training.name}' | fields @timestamp, @message | sort @timestamp desc | limit 50"
          region  = var.aws_region
        }
      }
    ]
  })
}
