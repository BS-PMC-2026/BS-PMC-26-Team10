import os
import uuid
from urllib.parse import unquote
from dotenv import load_dotenv
from supabase import create_client
from fastapi import UploadFile

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if (SUPABASE_URL and SUPABASE_KEY) else None


def get_chilleis():
    response = supabase.table("chilli").select("*").execute()
    return response.data


TEN_YEARS = 315_360_000  # seconds

async def upload_image(file: UploadFile, bucket_name: str, custom_name: str = None) -> str:
    file_bytes = await file.read()
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    name = _resolve_upload_filename(file.filename, ext, custom_name)
    supabase.storage.from_(bucket_name).upload(
        path=name,
        file=file_bytes,
        file_options={"content-type": file.content_type}
    )
    result = supabase.storage.from_(bucket_name).create_signed_url(name, TEN_YEARS)
    return result["signedURL"]


def _extract_storage_path(image_url: str, bucket_name: str):
    for marker in [f"/object/sign/{bucket_name}/", f"/object/public/{bucket_name}/"]:
        if marker in image_url:
            return unquote(image_url.split(marker, 1)[1].split("?")[0])
    return None


def _resolve_upload_filename(original_name: str, ext: str, custom_name: str = None) -> str:
    if custom_name and custom_name.strip():
        name = custom_name.strip()
        if "." not in name:
            name = f"{name}.{ext}"
        return name
    return original_name if original_name else f"{uuid.uuid4().hex}.{ext}"


def delete_image(image_url: str, bucket_name: str):
    if not image_url or "://" not in image_url:
        return
    try:
        path = _extract_storage_path(image_url, bucket_name)
        if path:
            supabase.storage.from_(bucket_name).remove([path])
    except Exception as e:
        print(f"Error deleting image from bucket {bucket_name}:\n", e)
