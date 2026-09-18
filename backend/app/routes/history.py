from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.record import DetectionRecord
from app.models.record import DetectionHistory, DetectionRecord
from fastapi import APIRouter, Depends, Query
from datetime import datetime

from fastapi import APIRouter, Depends, Query

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=list[DetectionHistory])
def get_history(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(DetectionRecord)

    if start is not None:
        query = query.filter(DetectionRecord.timestamp >= start)

    if end is not None:
        query = query.filter(DetectionRecord.timestamp <= end)

    return (
        query
        .order_by(DetectionRecord.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.delete("")
def reset_history(db: Session = Depends(get_db)):
    db.query(DetectionRecord).delete()
    db.commit()

    return {"message": "Detection history cleared"}


@router.delete("/reset")
def reset_detection_history(db: Session = Depends(get_db)):
    db.query(DetectionRecord).delete()
    db.commit()

    return {"message": "Detection history reset"}