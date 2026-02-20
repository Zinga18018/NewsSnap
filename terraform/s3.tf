# ──────────────────────────────────────────────
# S3 Buckets for ML Artifacts
# ──────────────────────────────────────────────

# Data bucket — raw & processed datasets
resource "aws_s3_bucket" "data" {
  bucket = "${var.s3_bucket_prefix}-data-${var.environment}"

  tags = {
    Purpose = "ML training data storage"
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Models bucket — trained model artifacts
resource "aws_s3_bucket" "models" {
  bucket = "${var.s3_bucket_prefix}-models-${var.environment}"

  tags = {
    Purpose = "Trained model storage"
  }
}

resource "aws_s3_bucket_versioning" "models" {
  bucket = aws_s3_bucket.models.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "models" {
  bucket = aws_s3_bucket.models.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Metrics bucket — evaluation results, dashboard data
resource "aws_s3_bucket" "metrics" {
  bucket = "${var.s3_bucket_prefix}-metrics-${var.environment}"

  tags = {
    Purpose = "ML metrics and evaluation results"
  }
}

resource "aws_s3_bucket_versioning" "metrics" {
  bucket = aws_s3_bucket.metrics.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "metrics" {
  bucket = aws_s3_bucket.metrics.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public read for metrics (dashboard reads from here)
resource "aws_s3_bucket_policy" "metrics_public_read" {
  bucket = aws_s3_bucket.metrics.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadMetrics"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.metrics.arn}/public/*"
      }
    ]
  })
}

resource "aws_s3_bucket_public_access_block" "metrics" {
  bucket = aws_s3_bucket.metrics.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 notification → Lambda trigger on new data upload
resource "aws_s3_bucket_notification" "data_upload" {
  bucket = aws_s3_bucket.data.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.pipeline_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "raw/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}
