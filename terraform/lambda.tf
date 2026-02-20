# ──────────────────────────────────────────────
# Lambda — Pipeline Trigger
# Fires when new data is uploaded to S3 raw/ prefix
# ──────────────────────────────────────────────

data "archive_file" "pipeline_trigger" {
  type        = "zip"
  output_path = "${path.module}/lambda/pipeline_trigger.zip"

  source {
    content  = <<-EOF
      import json
      import boto3
      import os
      from datetime import datetime

      sagemaker = boto3.client("sagemaker")

      def handler(event, context):
          """Triggered by S3 upload to raw/ prefix. Kicks off SageMaker training."""

          bucket = event["Records"][0]["s3"]["bucket"]["name"]
          key = event["Records"][0]["s3"]["object"]["key"]

          print(f"New data uploaded: s3://{bucket}/{key}")

          training_job_name = f"llmops-training-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

          response = sagemaker.create_training_job(
              TrainingJobName=training_job_name,
              RoleArn=os.environ["SAGEMAKER_ROLE_ARN"],
              AlgorithmSpecification={
                  "TrainingImage": os.environ["TRAINING_IMAGE"],
                  "TrainingInputMode": "File",
              },
              InputDataConfig=[
                  {
                      "ChannelName": "training",
                      "DataSource": {
                          "S3DataSource": {
                              "S3DataType": "S3Prefix",
                              "S3Uri": f"s3://{bucket}/processed/",
                              "S3DataDistributionType": "FullyReplicated",
                          }
                      },
                      "ContentType": "application/json",
                  }
              ],
              OutputDataConfig={
                  "S3OutputPath": f"s3://{os.environ['MODELS_BUCKET']}/training-output/"
              },
              ResourceConfig={
                  "InstanceType": os.environ.get("INSTANCE_TYPE", "ml.m5.large"),
                  "InstanceCount": 1,
                  "VolumeSizeInGB": 30,
              },
              StoppingCondition={"MaxRuntimeInSeconds": 7200},
              HyperParameters={
                  "model_name": os.environ.get("MODEL_NAME", "distilbert-base-uncased"),
                  "num_labels": os.environ.get("NUM_LABELS", "4"),
                  "epochs": os.environ.get("NUM_EPOCHS", "3"),
                  "batch_size": os.environ.get("BATCH_SIZE", "32"),
                  "learning_rate": os.environ.get("LEARNING_RATE", "2e-5"),
              },
          )

          print(f"Training job created: {training_job_name}")
          return {"statusCode": 200, "body": json.dumps({"trainingJob": training_job_name})}
    EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "pipeline_trigger" {
  function_name = "${var.project_name}-pipeline-trigger-${var.environment}"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 128

  filename         = data.archive_file.pipeline_trigger.output_path
  source_code_hash = data.archive_file.pipeline_trigger.output_base64sha256

  environment {
    variables = {
      SAGEMAKER_ROLE_ARN = aws_iam_role.sagemaker_execution.arn
      TRAINING_IMAGE     = "${aws_ecr_repository.training.repository_url}:latest"
      MODELS_BUCKET      = aws_s3_bucket.models.id
      MODEL_NAME         = var.model_name
      NUM_LABELS         = tostring(var.num_labels)
      NUM_EPOCHS         = "3"
      BATCH_SIZE         = "32"
      LEARNING_RATE      = "2e-5"
      INSTANCE_TYPE      = var.sagemaker_instance_type
    }
  }

  tags = {
    Purpose = "Trigger SageMaker training on new data upload"
  }
}

# Allow S3 to invoke the Lambda
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pipeline_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.data.arn
}
