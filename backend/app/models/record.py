from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base



class DetectionRecord(Base):
    __tablename__ = "detection_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    average_confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    inference_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )


class Detection(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float = Field(ge=0, le=1)


class DetectionResult(BaseModel):
    filename: str
    count: int = Field(ge=0)
    average_confidence: float = Field(ge=0, le=1)
    inference_time_ms: float = Field(ge=0)
    detections: list[Detection]
    timestamp: datetime

    image_width: int = Field(gt=0)
    image_height: int = Field(gt=0)
    annotated_image: str | None = None

class DetectionHistory(BaseModel):
    id: int
    timestamp: datetime
    count: int = Field(ge=0)
    average_confidence: float = Field(ge=0, le=1)
    inference_time_ms: float = Field(ge=0)

    model_config = ConfigDict(from_attributes=True)
    