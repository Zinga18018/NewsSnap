"""API request validation and response behavior tests."""

from fastapi.testclient import TestClient

from src.serving.api import app
from src.serving import api
import json


client = TestClient(app)


def test_predict_valid_text_returns_single_prediction():
    response = client.post("/predict", json={"text": "SpaceX launches a new satellite"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] in {"demo", "real"}
    assert len(payload["predictions"]) == 1


def test_predict_rejects_blank_text():
    response = client.post("/predict", json={"text": "    "})

    assert response.status_code == 422
    assert "at least 1 characters" in response.json()["detail"]


def test_predict_rejects_overly_long_text():
    response = client.post("/predict", json={"text": "x" * 5001})

    assert response.status_code == 422
    assert "cannot exceed 5000" in response.json()["detail"]


def test_metrics_fall_back_to_recorded_evidence_with_source_header(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "METRICS_DIR", tmp_path / "absent_models")
    monkeypatch.setattr(api, "HISTORICAL_METRICS_DIR", tmp_path)
    recorded = {"metrics": {"accuracy": .75}, "test_samples": 100}
    (tmp_path / "evaluation_results.json").write_text(json.dumps(recorded))
    response = client.get("/metrics/latest_evaluation.json")
    assert response.status_code == 200
    assert response.json() == recorded
    assert response.headers["X-Metrics-Source"] == "historical_evidence"


def test_model_directory_metrics_take_priority(tmp_path, monkeypatch):
    models = tmp_path / "models"
    evidence = tmp_path / "evidence"
    models.mkdir()
    evidence.mkdir()
    monkeypatch.setattr(api, "METRICS_DIR", models)
    monkeypatch.setattr(api, "HISTORICAL_METRICS_DIR", evidence)
    (models / "evaluation_results.json").write_text(json.dumps({"metrics": {"accuracy": .65}}))
    (evidence / "evaluation_results.json").write_text(json.dumps({"metrics": {"accuracy": .75}}))
    response = client.get("/metrics/latest_evaluation.json")
    assert response.json()["metrics"]["accuracy"] == .65
    assert response.headers["X-Metrics-Source"] == "model_directory"


def test_missing_metrics_in_both_locations_still_returns_404(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "METRICS_DIR", tmp_path / "models")
    monkeypatch.setattr(api, "HISTORICAL_METRICS_DIR", tmp_path / "evidence")
    assert client.get("/metrics/latest_evaluation.json").status_code == 404
    assert client.get("/metrics/latest_metrics.json").status_code == 404


def test_history_fallback_preserves_recorded_list_scores(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "METRICS_DIR", tmp_path / "models")
    monkeypatch.setattr(api, "HISTORICAL_METRICS_DIR", tmp_path)
    row = {"epoch": 1, "train_loss": 1.2, "train_accuracy": .6, "val_accuracy": .7}
    (tmp_path / "training_history.json").write_text(json.dumps([row]))
    response = client.get("/metrics/latest_metrics.json")
    assert response.headers["X-Metrics-Source"] == "historical_evidence"
    result = response.json()["metrics"][0]
    assert all(result[key] == value for key, value in row.items())
    assert result["val_acc"] == row["val_accuracy"]
