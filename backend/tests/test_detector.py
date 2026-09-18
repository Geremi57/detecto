from unittest.mock import MagicMock, patch

from app.services.detector import PersonDetector

def test_detector_counts_only_people():
    detector = PersonDetector.__new__(PersonDetector)
    detector.model = MagicMock()

    person_box = MagicMock()
    person_box.cls = [0]
    person_box.conf = [0.9]
    person_box.xyxy = [MagicMock()]
    person_box.xyxy[0].tolist.return_value = [10, 20, 50, 80]

    car_box = MagicMock()
    car_box.cls = [2]
    car_box.conf = [0.8]
    car_box.xyxy = [[60, 20, 90, 80]]

    mock_result = MagicMock()
    mock_result.boxes = [person_box, car_box]

    with patch.object(
        detector,
        "model",
        return_value=[mock_result],
    ):
        result = detector.detect(MagicMock())

    assert result["count"] == 1
    assert result["average_confidence"] == 0.9
    assert len(result["detections"]) == 1
    assert result["detections"][0]["confidence"] == 0.9