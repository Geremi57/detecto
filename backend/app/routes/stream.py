from io import BytesIO

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from PIL import Image, UnidentifiedImageError

from app.services.detector import detector

router = APIRouter(
    prefix="/detect",
    tags=["Detection Stream"],
)


@router.websocket("/stream")
async def detection_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_bytes()

            try:
                image = Image.open(BytesIO(data))
                image.load()
                image = image.convert("RGB")
            except UnidentifiedImageError:
                await websocket.send_json({
                    "error": "Invalid image frame.",
                })
                continue

            try:
                result = detector.detect(image)
            except Exception:
                await websocket.send_json({
                    "error": "Person detection failed.",
                })
                continue

            await websocket.send_json({
                "image_width": image.width,
                "image_height": image.height,
                **result,
            })

    except WebSocketDisconnect:
        pass