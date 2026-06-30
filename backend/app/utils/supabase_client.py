import os
import mimetypes
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = "bikefix"  # фиксируем bucket

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _raise_supabase_error(response: Any) -> None:
    error = getattr(response, "error", None)
    if error:
        raise RuntimeError(str(error))


def _resolve_public_url(response: Any) -> Optional[str]:
    if isinstance(response, dict):
        return response.get("publicUrl") or response.get("data", {}).get("publicUrl")
    return getattr(response, "publicUrl", None)


def upload_file(file_bytes: bytes, file_name: str, bucket: str = SUPABASE_BUCKET) -> str:
    storage = supabase.storage.from_(bucket)

    # путь внутри bucket
    path = f"avatars/{file_name}"

    # 1) Загружаем файл
    response = storage.upload(path, file_bytes)
    _raise_supabase_error(response)

    # 2) Определяем MIME
    mime_type, _ = mimetypes.guess_type(file_name)
    mime_type = mime_type or "application/octet-stream"

    # 3) Обновляем MIME через update()
    response2 = storage.update(path, file_bytes, {"contentType": mime_type})
    _raise_supabase_error(response2)

    # 4) Генерируем public URL вручную (SDK ломается — этот способ всегда работает)
    public_url = (
        f"{SUPABASE_URL}/storage/v1/object/public/"
        f"{bucket}/{path}"
    )

    return public_url


def insert_row(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    response = supabase.table(table).insert(data).execute()
    _raise_supabase_error(response)
    rows = getattr(response, "data", None)
    if not rows or not isinstance(rows, list):
        raise RuntimeError(f"Insert into {table} did not return data")
    return rows[0]


def fetch_rows(table: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    query = supabase.table(table).select("*")
    for column, value in (filters or {}).items():
        query = query.eq(column, value)
    response = query.execute()
    _raise_supabase_error(response)
    return getattr(response, "data", []) or []


def get_row_by_id(table: str, row_id: Any) -> Optional[Dict[str, Any]]:
    response = supabase.table(table).select("*").eq("id", row_id).execute()
    _raise_supabase_error(response)
    rows = getattr(response, "data", None)
    if not rows:
        return None
    return rows[0]


def update_row(table: str, row_id: Any, data: Dict[str, Any]) -> Dict[str, Any]:
    response = supabase.table(table).update(data).eq("id", row_id).execute()
    _raise_supabase_error(response)

    rows = getattr(response, "data", None)
    if not rows or not isinstance(rows, list):
        raise RuntimeError(f"Update on {table} did not return data")

    return rows[0]
