"""
Metrics Logging Module
Logs ML metrics to CloudWatch custom metrics and S3 JSON files.
"""

import json
import os
import sys
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    import config
except ImportError:
    config = None


class MetricsLogger:
    """Logs training and evaluation metrics to CloudWatch and S3."""

    def __init__(self, namespace: str = None, bucket: str = None):
        self.namespace = namespace or f"{getattr(config, 'PROJECT_NAME', 'llmops')}/MLPipeline"
        self.bucket = bucket or getattr(config, "S3_BUCKET_METRICS", "llmops-ml-metrics-dev")
        self.region = getattr(config, "AWS_REGION", "us-east-1")
        self._history = []

        try:
            self.cloudwatch = boto3.client("cloudwatch", region_name=self.region)
            self.s3 = boto3.client("s3", region_name=self.region)
            self._aws_available = True
        except Exception:
            self._aws_available = False
            print("[Metrics] AWS not available, logging locally only")

    def log_metric(self, name: str, value: float, unit: str = "None",
                   dimensions: dict = None):
        """
        Log a single metric to CloudWatch.

        Args:
            name: Metric name (e.g., 'TrainLoss', 'ValAccuracy')
            value: Metric value
            unit: CloudWatch unit (None, Count, Seconds, Percent, etc.)
            dimensions: Optional dict of dimension name/value pairs
        """
        metric_data = {
            "MetricName": name,
            "Value": value,
            "Unit": unit,
            "Timestamp": datetime.utcnow(),
        }

        if dimensions:
            metric_data["Dimensions"] = [
                {"Name": k, "Value": str(v)} for k, v in dimensions.items()
            ]

        # Log to CloudWatch
        if self._aws_available:
            try:
                self.cloudwatch.put_metric_data(
                    Namespace=self.namespace,
                    MetricData=[metric_data],
                )
            except ClientError as e:
                print(f"[Metrics] CloudWatch error: {e}")

        # Track locally
        self._history.append({
            "name": name,
            "value": value,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def log_training_epoch(self, epoch: int, train_loss: float, train_acc: float,
                           val_loss: float, val_acc: float, val_f1: float):
        """Log all metrics for a training epoch."""
        dims = {"Epoch": str(epoch)}
        self.log_metric("TrainLoss", train_loss, dimensions=dims)
        self.log_metric("TrainAccuracy", train_acc, "Percent", dimensions=dims)
        self.log_metric("ValLoss", val_loss, dimensions=dims)
        self.log_metric("ValAccuracy", val_acc, "Percent", dimensions=dims)
        self.log_metric("ValF1", val_f1, dimensions=dims)

    def log_evaluation(self, metrics: dict):
        """Log evaluation metrics."""
        for name, value in metrics.items():
            self.log_metric(f"Eval_{name}", value)

    def save_to_s3(self, key_prefix: str = "public"):
        """Save the full metrics history to S3 as JSON for the dashboard."""
        if not self._aws_available:
            print("[Metrics] Skipping S3 save — AWS not available")
            return

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "project": getattr(config, "PROJECT_NAME", "llmops"),
            "metrics": self._history,
        }

        try:
            # Save as latest (overwrite)
            self.s3.put_object(
                Bucket=self.bucket,
                Key=f"{key_prefix}/latest_metrics.json",
                Body=json.dumps(payload, indent=2),
                ContentType="application/json",
            )

            # Save timestamped version
            self.s3.put_object(
                Bucket=self.bucket,
                Key=f"history/metrics_{timestamp}.json",
                Body=json.dumps(payload, indent=2),
                ContentType="application/json",
            )

            print(f"[Metrics] Saved metrics to S3: {self.bucket}/{key_prefix}/latest_metrics.json")
        except ClientError as e:
            print(f"[Metrics] S3 save error: {e}")

    def save_locally(self, filepath: str = "metrics_history.json"):
        """Save metrics history to a local JSON file."""
        with open(filepath, "w") as f:
            json.dump(self._history, f, indent=2)
        print(f"[Metrics] Saved {len(self._history)} metrics to {filepath}")


# ── Convenience singleton ─────────────────────
_logger = None


def get_logger() -> MetricsLogger:
    """Get or create the global metrics logger."""
    global _logger
    if _logger is None:
        _logger = MetricsLogger()
    return _logger
