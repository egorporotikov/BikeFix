import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _raise_supabase_error(response: Any) -> None:
    error = getattr(response, "error", None)
    if error:
        if isinstance(error, dict):
            raise RuntimeError(error.get("message") or str(error))
        raise RuntimeError(str(error))


def _resolve_public_url(response: Any) -> Optional[str]:
    if isinstance(response, dict):
        return response.get("publicUrl") or response.get("data", {}).get("publicUrl")
    return getattr(response, "publicUrl", None)


def upload_file(file_bytes: bytes, file_name: str) -> str:
    storage = supabase.storage.from_(SUPABASE_BUCKET)
    response = storage.upload(file_name, file_bytes)
    _raise_supabase_error(response)

    public_url_response = storage.get_public_url(file_name)
    public_url = _resolve_public_url(public_url_response)
    if not public_url:
        raise RuntimeError("Unable to generate public URL for uploaded file")
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
    response = supabase.table(table).select("*").eq("id", row_id).single().execute()
    _raise_supabase_error(response)
    return getattr(response, "data", None)
