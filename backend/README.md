# Detecto Backend

FastAPI backend for real-time person detection and counting using YOLO.

## Features

- Person detection with YOLO
- JPEG and PNG image uploads
- Person count and confidence scores
- Bounding-box coordinates
- Annotated detection images
- Detection history stored in SQLite
- Date-range filtering and pagination
- Detection history reset
- Database health check
- Inference-time tracking
- Automated API and detector tests

## Requirements

- Python 3.10+
- pip
- Virtual environment

## Setup

Create and activate a virtual environment:

```
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Create .env:

```
MODEL_PATH=yolo11n.pt
CONFIDENCE_THRESHOLD=0.5
DATABASE_URL=sqlite:///./detecto.db
```

Start the API:

```
uvicorn app.main:app --reload
```

The API will be available at:

```
http://127.0.0.1:8000
```

Interactive API documentation:

```
http://127.0.0.1:8000/docs
```

## API Endpoints

### Health
GET /health

Checks API and database connectivity.

### Detection
POST /detect

Upload a JPEG or PNG image for person detection.

The response includes:

filename
image dimensions
person count
average confidence
inference time
bounding boxes
annotated image

### History
GET /history

Returns stored detection results.

Optional query parameters:

start
end
limit
offset

### Reset History
DELETE /history/reset

Clears all stored detection records.

Testing

Run the complete test suite:

```
pytest -q
```

The tests cover:

- Upload validation
- Invalid and empty images
- Detection responses
- Detection failure handling
- History persistence
- History filtering
- Pagination
- Reset behavior
- Person-class filtering
- Annotated image responses
- Project Structure

```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── routes/
│   │   ├── detect.py
│   │   └── history.py
│   ├── models/
│   │   └── record.py
│   ├── services/
│   │   └── detector.py
│   └── utils/
│       └── preprocessing.py
├── tests/
├── .env.example
├── requirements.txt
└── README.md
```

### Model

Detecto uses a pretrained YOLO model configured through MODEL_PATH.

Only detections belonging to the COCO person class are included in the result.

The confidence threshold can be configured using CONFIDENCE_THRESHOLD.

