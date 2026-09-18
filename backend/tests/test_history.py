from fastapi.testclient import TestClient

from app.main import app

from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.record import DetectionRecord

from io import BytesIO
from PIL import Image
from unittest.mock import patch


client = TestClient(app)


def test_get_history_returns_records():
    response = client.get("/history")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_history_accepts_pagination():
    response = client.get("/history?limit=10&offset=0")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_history_rejects_invalid_limit():
    response = client.get("/history?limit=0")

    assert response.status_code == 422


def test_get_history_rejects_large_limit():
    response = client.get("/history?limit=101")

    assert response.status_code == 422


def test_detection_record_can_be_persisted():
    db = SessionLocal()

    record = DetectionRecord(
        timestamp=datetime.now(timezone.utc),
        count=3,
        average_confidence=0.85,
        inference_time_ms=250.5,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    assert record.id is not None
    assert record.count == 3
    assert record.average_confidence == 0.85
    assert record.inference_time_ms == 250.5

    db.delete(record)
    db.commit()
    db.close()

def test_get_history_rejects_invalid_date():
    response = client.get(
        "/history?start=not-a-date"
    )

    assert response.status_code == 422


def test_get_history_rejects_negative_offset():
    response = client.get(
        "/history?offset=-1"
    )

    assert response.status_code == 422


def test_detection_history_reset_flow():
    image = Image.new("RGB", (100, 100), "white")
    buffer = BytesIO()
    image.save(buffer, format="JPEG")

    mock_result = {
        "count": 2,
        "average_confidence": 0.88,
        "inference_time_ms": 150.0,
        "detections": [],
    }

    with patch(
        "app.routes.detect.detector.detect",
        return_value=mock_result,
    ):
        response = client.post(
            "/detect",
            files={
                "file": (
                    "integration.jpg",
                    buffer.getvalue(),
                    "image/jpeg",
                )
            },
        )

    assert response.status_code == 200

    history = client.get("/history")
    assert history.status_code == 200
    assert len(history.json()) >= 1

    reset = client.delete("/history/reset")
    assert reset.status_code == 200

    history = client.get("/history")
    assert history.status_code == 200
    assert history.json() == []