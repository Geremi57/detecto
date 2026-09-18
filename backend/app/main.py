from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.routes import detect, history

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Detecto API",
    description="Real-time person detection and counting API",
    version="1.0.0",
)

app.include_router(detect.router)
app.include_router(history.router)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "ok",
    }