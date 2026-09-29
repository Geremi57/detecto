from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    prefix="/detect",
    tags=["Detection Stream"],
)


@router.websocket("/stream")
async def detection_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_text(f"received: {message}")
    except WebSocketDisconnect:
        pass