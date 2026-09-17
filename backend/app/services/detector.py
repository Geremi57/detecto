import time

from ultralytics import YOLO

from app.config import CONFIDENCE_THRESHOLD, MODEL_PATH


class PersonDetector:
    PERSON_CLASS_ID = 0

    def __init__(self):
        self.model = YOLO(MODEL_PATH)

    def detect(self, image):
        start_time = time.perf_counter()

        results = self.model(
            image,
            conf=CONFIDENCE_THRESHOLD,
            verbose=False,
        )

        detections = []

        for result in results:
            if result.boxes is None:
                continue

            for box in result.boxes:
                class_id = int(box.cls[0])

                if class_id != self.PERSON_CLASS_ID:
                    continue

                confidence = float(box.conf[0])
                coordinates = box.xyxy[0].tolist()

                detections.append(
                    {
                        "x1": round(coordinates[0], 2),
                        "y1": round(coordinates[1], 2),
                        "x2": round(coordinates[2], 2),
                        "y2": round(coordinates[3], 2),
                        "confidence": round(confidence, 4),
                    }
                )

        inference_time = (time.perf_counter() - start_time) * 1000

        average_confidence = (
            sum(d["confidence"] for d in detections) / len(detections)
            if detections
            else 0.0
        )

        return {
            "count": len(detections),
            "average_confidence": round(average_confidence, 4),
            "inference_time_ms": round(inference_time, 2),
            "detections": detections,
        }