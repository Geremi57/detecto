from fastapi import FastAPI

from app.routes import detect, history

app = FastAPI(
    title="Detecto API",
    description="Real-time person detection and counting API",
    version="1.0.0",
)

app.include_router(detect.router)
app.include_router(history.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}