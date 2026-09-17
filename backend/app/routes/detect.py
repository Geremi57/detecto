from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from app.models.record import DetectionResult
from app.services.detector import detector

router = APIRouter(
    prefix="/detect",
    tags=["Detection"],
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
}


@router.post("", response_model=DetectionResult)
async def detect_people(file: UploadFile = File(...)):
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

    result = detector.detect(image)

    return DetectionResult(
        filename=file.filename,
        timestamp=datetime.now(timezone.utc),
        **result,
    )