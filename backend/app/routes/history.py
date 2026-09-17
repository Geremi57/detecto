from fastapi import APIRouter

router = APIRouter(
    prefix="/history",
    tags=["History"],
)


@router.get("")
def get_history():
    return []


@router.delete("")
def reset_history():
    return {
        "message": "Detection history cleared",
    }