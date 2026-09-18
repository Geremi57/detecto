from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.models.record import DetectionResult
from app.services.detector import detector

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.record import DetectionRecord

router = APIRouter(
    prefix="/detect",
    tags=["Detection"],
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
}

@router.post("", response_model=DetectionResult)
async def detect_people(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was provided.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Only JPEG and PNG images are allowed.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    try:
        image = Image.open(BytesIO(contents))
        image.load()
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    image = image.convert("RGB")

    image_width, image_height = image.size

    result = detector.detect(image)

    record = DetectionRecord(
        timestamp=datetime.now(timezone.utc),
        count=result["count"],
        average_confidence=result["average_confidence"],
        inference_time_ms=result["inference_time_ms"],
    )

    db.add(record)
    db.commit()

    return DetectionResult(
       filename=file.filename,
        timestamp=datetime.now(timezone.utc),
        image_width=image_width,
        image_height=image_height,
        **result,
    )