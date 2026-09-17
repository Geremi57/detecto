import os

from dotenv import load_dotenv

load_dotenv()


MODEL_PATH = os.getenv("MODEL_PATH", "yolo11n.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./detecto.db")