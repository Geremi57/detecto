from PIL import Image, ImageDraw


def draw_detections(image: Image.Image, detections: list[dict]) -> Image.Image:
    output = image.copy()
    draw = ImageDraw.Draw(output)

    for detection in detections:
        x1 = detection["x1"]
        y1 = detection["y1"]
        x2 = detection["x2"]
        y2 = detection["y2"]
        confidence = detection["confidence"]

        draw.rectangle(
            (x1, y1, x2, y2),
            outline="red",
            width=3,
        )

        draw.text(
            (x1, max(0, y1 - 15)),
            f"person {confidence:.2f}",
            fill="red",
        )

    return output