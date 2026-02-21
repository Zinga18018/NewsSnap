"""API request validation and response behavior tests."""

from fastapi.testclient import TestClient

from src.serving.api import app


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
