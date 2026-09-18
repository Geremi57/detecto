from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

from unittest.mock import patch

from app.database import SessionLocal
from app.models.record import DetectionRecord

client = TestClient(app)


def create_test_image():
    image = Image.new("RGB", (100, 100), "white")
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)

    return buffer


def test_detect_rejects_unsupported_file_type():
    response = client.post(
        "/detect",
        files={
            "file": (
                "test.txt",
                b"not an image",
                "text/plain",
            )
        },
    )

    assert response.status_code == 415
    assert response.json()["detail"] == (
        "Unsupported file type. Only JPEG and PNG images are allowed."
    )


def test_detect_rejects_empty_file():
    response = client.post(
        "/detect",
        files={
            "file": (
                "empty.jpg",
                b"",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded file is empty."


def test_detect_rejects_invalid_image():
    response = client.post(
        "/detect",
        files={
            "file": (
                "broken.jpg",
                b"this is not a real image",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "The uploaded file is not a valid image."
    )

def test_detect_saves_result_to_history():
    mock_result = {
        "count": 2,
        "average_confidence": 0.9,
        "inference_time_ms": 120.5,
        "detections": [
            {
                "x1": 10.0,
                "y1": 20.0,
                "x2": 50.0,
                "y2": 80.0,
                "confidence": 0.91,
            },
            {
                "x1": 60.0,
                "y1": 20.0,
                "x2": 90.0,
                "y2": 80.0,
                "confidence": 0.89,
            },
        ],
    }

    image = create_test_image()

    with patch(
        "app.routes.detect.detector.detect",
        return_value=mock_result,
    ):
        response = client.post(
            "/detect",
            files={
                "file": (
                    "test.jpg",
                    image.getvalue(),
                    "image/jpeg",
                )
            },
        )

    assert response.status_code == 200
    assert response.json()["count"] == 2

    db = SessionLocal()

    record = (
        db.query(DetectionRecord)
        .order_by(DetectionRecord.id.desc())
        .first()
    )

    assert record is not None
    assert record.count == 2
    assert record.average_confidence == 0.9
    assert record.inference_time_ms == 120.5

    db.delete(record)
    db.commit()
    db.close()