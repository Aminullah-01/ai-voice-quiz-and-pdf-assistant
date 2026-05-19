import os
import re
import time
from typing import Iterable, List

from PyPDF2 import PdfReader
from werkzeug.utils import secure_filename

from services.errors import ServiceError


def allowed_file(filename: str, allowed_extensions: Iterable[str]) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions


def save_pdf_upload(file_storage, upload_folder: str, allowed_extensions: Iterable[str]) -> tuple:
    if not file_storage or file_storage.filename == "":
        raise ServiceError("No file selected.", status_code=400)

    if not allowed_file(file_storage.filename, allowed_extensions):
        raise ServiceError("Invalid file type. Upload a PDF.", status_code=400)

    safe_name = secure_filename(file_storage.filename)
    upload_id = f"{int(time.time())}_{safe_name.replace('.', '_')}"
    file_path = os.path.join(upload_folder, f"{upload_id}.pdf")
    file_storage.save(file_path)
    return safe_name, upload_id, file_path


def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
    except Exception as exc:
        raise ServiceError("Failed to read PDF file.", status_code=400) from exc

    pages_text: List[str] = []
    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""
        if page_text.strip():
            pages_text.append(page_text)

    return "\n".join(pages_text)


def clean_text(text: str) -> str:
    if not text:
        return ""

    cleaned = re.sub(r"\s+", " ", text)
    cleaned = cleaned.replace("\u00a0", " ")
    return cleaned.strip()
