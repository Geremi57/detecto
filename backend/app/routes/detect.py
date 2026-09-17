from fastapi import APIRouter, File, UploadFile

router = APIRouter(
    prefix="/detect",
    tags=["Detection"],
)


@router.post("")
async def detect_people(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "message": "Detection endpoint scaffolded",
    }