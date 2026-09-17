from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.record import DetectionRecord
from app.models.record import DetectionHistory, DetectionRecord

from datetime import datetime

from fastapi import APIRouter, Depends, Query

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=list[DetectionHistory])
def get_history(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(DetectionRecord)

    if start is not None:
        query = query.filter(DetectionRecord.timestamp >= start)

    if end is not None:
        query = query.filter(DetectionRecord.timestamp <= end)

    return query.order_by(DetectionRecord.timestamp.desc()).all()

@router.delete("")
def reset_history(db: Session = Depends(get_db)):
    db.query(DetectionRecord).delete()
    db.commit()

    return {"message": "Detection history cleared"}