from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.record import DetectionRecord

router = APIRouter(prefix="/history", tags=["History"])


@router.get("")
def get_history(db: Session = Depends(get_db)):
    records = (
        db.query(DetectionRecord)
        .order_by(DetectionRecord.timestamp.desc())
        .all()
    )

    return records


@router.delete("")
def reset_history():
    return {"message": "Detection history cleared"}