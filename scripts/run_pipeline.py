"""Validate supplied evaluation files, then optionally publish them to S3.

No scores are synthesized. By default no AWS requests are made. An upload needs
--upload and an explicit bucket. File hashes do not independently verify a run.
"""
import argparse
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.utils.artifacts import dashboard_history


def load_artifact(path: Path, *, history: bool = False) -> dict | list:
    payload = json.loads(path.read_text(encoding="utf-8"))
    # Validate the complete document before any object can be uploaded, including
    # optional nested fields outside the headline metrics dictionary.
    json.dumps(payload, allow_nan=False)
    if history:
        rows = payload if isinstance(payload, list) else payload.get("metrics") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows or not all(isinstance(row, dict) and "epoch" in row for row in rows):
            raise ValueError(f"{path.name}: missing measured training history")
        loss_fields = {"train_loss", "val_loss"}
        rate_fields = {"train_accuracy", "val_accuracy", "train_acc", "val_acc", "val_f1"}
        measured_fields = loss_fields | rate_fields
        for row in rows:
            if not measured_fields.intersection(row):
                raise ValueError(f"{path.name}: each epoch needs at least one measured loss or score")
            for field in {"epoch"} | measured_fields.intersection(row):
                value = row[field]
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                    raise ValueError(f"{path.name}: {field} must be finite numeric data")
                if value < 0 or (field in rate_fields and value > 1):
                    raise ValueError(f"{path.name}: {field} is outside its metric range")
            for original, alias in (("train_accuracy", "train_acc"), ("val_accuracy", "val_acc")):
                if original in row and alias in row and row[original] != row[alias]:
                    raise ValueError(f"{path.name}: conflicting values for {original} and {alias}")
    else:
        if not isinstance(payload, dict):
            raise ValueError(f"{path.name}: expected a JSON object")
        count = payload.get("test_samples", payload.get("num_test_samples"))
        if isinstance(count, bool) or not isinstance(count, int) or count <= 0:
            raise ValueError(f"{path.name}: num_test_samples must be a positive integer")
        metrics = payload.get("metrics")
        if not isinstance(metrics, dict) or "accuracy" not in metrics:
            raise ValueError(f"{path.name}: missing measured accuracy")
        for key, value in metrics.items():
            if (isinstance(value, bool) or not isinstance(value, (int, float))
                    or not math.isfinite(value)):
                raise ValueError(f"{path.name}: {key} must be finite numeric data")
            lower = -1 if key == "mcc" else 0
            if not lower <= value <= 1:
                raise ValueError(f"{path.name}: {key} is outside its metric range")
    return payload


def prepare_publication(evaluation_path: Path, history_path: Path | None = None) -> dict:
    paths = {"latest_evaluation.json": evaluation_path}
    if history_path is not None:
        paths["latest_metrics.json"] = history_path
    artifacts = {}
    manifest = {
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "source_kind": "supplied_evaluation_files",
        "claim_boundary": "File validation is not independent verification of training or evaluation.",
        "artifacts": {},
    }
    for key, path in paths.items():
        artifacts[key] = load_artifact(path, history=key == "latest_metrics.json")
        if key == "latest_metrics.json":
            artifacts[key] = dashboard_history(artifacts[key])
        manifest["artifacts"][key] = {
            "source_filename": path.name,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
    return {"artifacts": artifacts, "manifest": manifest}


def upload_publication(publication: dict, bucket: str, client) -> None:
    for key, payload in {**publication["artifacts"],
                         "publication_manifest.json": publication["manifest"]}.items():
        client.put_object(Bucket=bucket, Key=key,
                          Body=json.dumps(payload, indent=2, allow_nan=False).encode("utf-8"),
                          ContentType="application/json")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evaluation", type=Path, required=True)
    parser.add_argument("--training-history", type=Path)
    parser.add_argument("--upload", action="store_true")
    parser.add_argument("--bucket")
    args = parser.parse_args()
    if args.upload and not args.bucket:
        parser.error("--upload requires an explicit --bucket")
    try:
        publication = prepare_publication(args.evaluation, args.training_history)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(publication["manifest"], indent=2))
    if args.upload:
        import boto3
        upload_publication(publication, args.bucket, boto3.client("s3"))
        print("Uploaded supplied artifacts and their file-hash manifest.")
    else:
        print("Validation only. No AWS requests were made.")


if __name__ == "__main__":
    main()
