from PIL import Image

from app.utils.preprocessing import draw_detections


def test_draw_detections_preserves_image_size():
    image = Image.new("RGB", (200, 100), "white")

    detections = [
        {
            "x1": 20,
            "y1": 10,
            "x2": 80,
            "y2": 90,
            "confidence": 0.95,
        }
    ]

    result = draw_detections(image, detections)

    assert result.size == image.size
    assert result.mode == "RGB"