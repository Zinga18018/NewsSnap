"""Regression tests: publish supplied evidence, never fabricated score defaults."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import pytest

from scripts.run_pipeline import prepare_publication, upload_publication

ROOT = Path(__file__).resolve().parents[1]


def test_historical_file_format_and_values_are_preserved():
    path = ROOT / "evidence/evaluation_results.json"
    history = ROOT / "evidence/training_history.json"
    result = prepare_publication(path, history)
    assert result["artifacts"]["latest_evaluation.json"] == json.loads(path.read_text())
    original = json.loads(history.read_text())[0]
    published = result["artifacts"]["latest_metrics.json"]["metrics"][0]
    assert all(published[key] == value for key, value in original.items())
    assert published["train_acc"] == original["train_accuracy"]
    assert published["val_acc"] == original["val_accuracy"]
    assert result["manifest"]["artifacts"]["latest_evaluation.json"]["sha256"] == hashlib.sha256(path.read_bytes()).hexdigest()


@pytest.mark.parametrize("count,accuracy", [(0, .8), (True, .8), (5, 1.1), (5, float("nan")), (5, True)])
def test_invalid_measurements_rejected(tmp_path, count, accuracy):
    path = tmp_path / "evaluation.json"
    path.write_text(json.dumps({"test_samples": count, "metrics": {"accuracy": accuracy}}))
    with pytest.raises(ValueError):
        prepare_publication(path)


def test_missing_evidence_fails_without_creating_scores(tmp_path):
    with pytest.raises(FileNotFoundError):
        prepare_publication(tmp_path / "missing.json")


def test_default_cli_is_local_even_without_boto3():
    completed = subprocess.run(
        [sys.executable, str(ROOT / "scripts/run_pipeline.py"),
         "--evaluation", str(ROOT / "evidence/evaluation_results.json")],
        capture_output=True, text=True, check=False,
    )
    assert completed.returncode == 0, completed.stderr
    assert "No AWS requests were made" in completed.stdout


def test_upload_uses_the_supplied_values():
    class RecordingClient:
        def __init__(self):
            self.calls = []
        def put_object(self, **kwargs):
            self.calls.append(kwargs)
    client = RecordingClient()
    publication = prepare_publication(ROOT / "evidence/evaluation_results.json")
    upload_publication(publication, "test-bucket", client)
    assert len(client.calls) == 2
    assert json.loads(client.calls[0]["Body"]) == publication["artifacts"]["latest_evaluation.json"]
    assert all(call["Bucket"] == "test-bucket" for call in client.calls)


@pytest.mark.parametrize("row", [
    {"epoch": 1},
    {"epoch": "one", "train_loss": .5},
    {"epoch": 1, "train_loss": "unavailable"},
    {"epoch": 1, "train_loss": -.1},
    {"epoch": 1, "val_accuracy": 1.2},
    {"epoch": 1, "val_f1": True},
    {"epoch": 1, "val_accuracy": .8, "val_acc": .9},
])
def test_history_requires_valid_measured_values(tmp_path, row):
    history = tmp_path / "history.json"
    history.write_text(json.dumps([row]))
    with pytest.raises(ValueError):
        prepare_publication(ROOT / "evidence/evaluation_results.json", history)


def test_normalized_dictionary_history_preserves_measurements(tmp_path):
    history = tmp_path / "history.json"
    payload = {"model_name": "recorded-model", "metrics": [{"epoch": 1, "train_loss": 1.3, "val_acc": .8}]}
    history.write_text(json.dumps(payload))
    publication = prepare_publication(ROOT / "evidence/evaluation_results.json", history)
    assert publication["artifacts"]["latest_metrics.json"] == payload


def test_nonfinite_optional_evaluation_fields_rejected_before_publication(tmp_path):
    path = tmp_path / "evaluation.json"
    path.write_text(json.dumps({"test_samples": 5, "metrics": {"accuracy": .8},
                                "classification_report": {"optional_metric": float("nan")}}))
    with pytest.raises(ValueError):
        prepare_publication(path)
