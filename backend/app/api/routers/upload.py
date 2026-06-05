import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.utils.supabase_client import upload_file

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    payload = await photo.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_name = f"{uuid.uuid4().hex}_{photo.filename}"

    try:
        public_url = upload_file(payload, file_name)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"url": public_url}
