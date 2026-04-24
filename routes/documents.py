"""
AetherDocs Routes — document upload, processing, chat, invoice drafting.
Mounted under /api/documents, /api/chat, /api/invoice
"""
import os
import json
import re
import tempfile
import uuid
import mimetypes
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("AetherDocs")

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

STORAGE_BUCKET = "documents"
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"

IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"}
IMAGE_MIME = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "png": "image/png", "webp": "image/webp",
    "gif": "image/gif", "bmp": "image/bmp", "tiff": "image/tiff",
}
TEXT_EXTS = {"txt", "csv", "md", "html"}

from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

from google import genai
from google.genai import types
genai_client = genai.Client(api_key=GEMINI_API_KEY)

# ─── Router ──────────────────────────────────────────────────────────────────

router = APIRouter(tags=["documents"])

# ─── Helpers ─────────────────────────────────────────────────────────────────


def infer_document_type(filename: str) -> str:
    lower = filename.lower()
    if any(lower.endswith(f".{e}") for e in IMAGE_EXTS):
        return "image"
    if lower.endswith(".pdf"):
        return "pdf"
    if lower.endswith(".txt"):
        return "text"
    if lower.endswith(".csv"):
        return "csv"
    return "unknown"


def get_content_type(filename: str, declared: str | None) -> str:
    if declared and declared not in ("application/octet-stream", ""):
        return declared
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"


def parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            return json.loads(match.group())
        return {"raw_extraction": raw, "note": "Could not parse as JSON"}


EXTRACTION_PROMPT = """Analyze this document and extract key information as a JSON object.

- INVOICE → { "invoice_number", "date", "vendor_name", "total_amount", "currency", "line_items": [{"description","quantity","unit_price","total"}] }
- RECEIPT → { "vendor_name", "date", "total_amount", "currency", "items": [{"description","amount"}] }
- CONTRACT → { "parties": [], "effective_date", "expiration_date", "summary" }
- ID / PASSPORT → { "name", "id_number", "date_of_birth", "expiration_date", "issuing_authority" }
- OTHER → { "summary", "key_entities": { "people":[], "organizations":[], "dates":[], "amounts":[] } }

Return ONLY valid JSON. No markdown fences. No explanation."""


def build_gemini_contents(file_bytes: bytes, ext: str, temp_file_path: str) -> list:
    lower = ext.lower()

    if lower in IMAGE_EXTS:
        mime = IMAGE_MIME.get(lower, "image/jpeg")
        logger.info(f"Using inline bytes for image ({mime})")
        return [
            types.Part.from_bytes(data=file_bytes, mime_type=mime),
            EXTRACTION_PROMPT,
        ]

    if lower in TEXT_EXTS:
        text_content = file_bytes.decode("utf-8", errors="replace")
        logger.info("Using inline text for text/csv document")
        return [f"Document content:\n\n{text_content}\n\n{EXTRACTION_PROMPT}"]

    logger.info(f"Using Gemini File API for .{ext} document")
    gemini_file = genai_client.files.upload(file=temp_file_path)
    return [gemini_file, EXTRACTION_PROMPT]


def build_documents_context(docs: list[dict]) -> str:
    if not docs:
        return "(No processed documents available)"
    parts = []
    for i, doc in enumerate(docs, 1):
        part = (
            f"[Document {i}]\n"
            f"  File: {doc.get('file_name', 'unknown')}\n"
            f"  Type: {doc.get('document_type', 'unknown')}\n"
            f"  Uploaded: {doc.get('created_at', '')[:10]}\n"
            f"  Extracted data: {json.dumps(doc.get('extracted_data') or {}, indent=2)}"
        )
        parts.append(part)
    return "\n\n".join(parts)


async def _notify_interconnect_document(document_id: str, extracted_data: dict) -> None:
    from aether_interconnect import on_document_processed
    try:
        await on_document_processed(document_id, extracted_data)
    except Exception as exc:
        logger.warning(f"Interconnect notify failed for {document_id}: {exc}")


# ─── Request Models ──────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []


class InvoiceDraftRequest(BaseModel):
    prompt: str


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload file to Supabase Storage and register a pending DB record."""
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    doc_id = str(uuid.uuid4())
    original_filename = file.filename or "unnamed_file"
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else ""
    storage_path = f"{doc_id}.{ext}" if ext else doc_id
    content_type = get_content_type(original_filename, file.content_type)
    doc_type = infer_document_type(original_filename)

    logger.info(f"Uploading '{original_filename}' ({len(file_bytes)} bytes) -> {storage_path}")

    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    try:
        supabase.table("documents").insert({
            "id": doc_id,
            "file_name": original_filename,
            "file_path": storage_path,
            "document_type": doc_type,
            "status": "pending",
        }).execute()
    except Exception as e:
        logger.error(f"DB insert failed: {e}")
        try:
            supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"DB insert failed: {e}")

    return {
        "message": "Document uploaded successfully",
        "document_id": doc_id,
        "file_name": original_filename,
        "storage_path": storage_path,
    }


@router.post("/api/documents/process/{document_id}")
async def process_document(document_id: str, background_tasks: BackgroundTasks):
    """Download from Supabase Storage, extract via Gemini, update DB."""
    doc_resp = supabase.table("documents").select("*").eq("id", document_id).execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_record = doc_resp.data[0]
    storage_path = doc_record["file_path"]
    ext = storage_path.rsplit(".", 1)[-1] if "." in storage_path else "tmp"

    try:
        file_bytes = supabase.storage.from_(STORAGE_BUCKET).download(storage_path)
    except Exception as e:
        supabase.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
        raise HTTPException(status_code=500, detail=f"Storage download failed: {e}")

    temp_file_path = None
    extracted_data: dict = {}

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            tmp.write(file_bytes)
            temp_file_path = tmp.name

        contents = build_gemini_contents(file_bytes, ext, temp_file_path)

        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        raw_text = response.text or "{}"
        extracted_data = parse_json_response(raw_text)

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Gemini processing failed for {document_id}: {err_msg}")
        supabase.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded.")
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {err_msg}")
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    supabase.table("documents").update({
        "status": "done",
        "extracted_data": extracted_data,
    }).eq("id", document_id).execute()

    background_tasks.add_task(_notify_interconnect_document, document_id, extracted_data)

    return {
        "message": "Document processed successfully",
        "document_id": document_id,
        "extracted_data": extracted_data,
    }


@router.get("/api/documents")
async def get_documents():
    """Returns all documents, newest first."""
    try:
        resp = supabase.table("documents").select("*").order("created_at", desc=True).execute()
        return {"documents": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {e}")


@router.get("/api/documents/{document_id}/signed-url")
async def get_signed_url(document_id: str, expires_in: int = 3600):
    doc_resp = supabase.table("documents").select("file_path").eq("id", document_id).execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")

    storage_path = doc_resp.data[0]["file_path"]
    try:
        result = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(
            path=storage_path, expires_in=expires_in
        )
        return {"signed_url": result["signedURL"], "expires_in": expires_in}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not create signed URL: {e}")


@router.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    doc_resp = supabase.table("documents").select("file_path, file_name").eq("id", document_id).execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")

    storage_path = doc_resp.data[0]["file_path"]
    file_name = doc_resp.data[0].get("file_name", document_id)

    storage_ok = False
    try:
        supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        storage_ok = True
    except Exception as e:
        logger.warning(f"Storage delete warning (non-fatal): {e}")

    try:
        supabase.table("documents").delete().eq("id", document_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB delete failed: {e}")

    return {
        "message": "Document deleted successfully",
        "document_id": document_id,
        "storage_removed": storage_ok,
    }


# ─── Chat ────────────────────────────────────────────────────────────────────

CHAT_SYSTEM_PROMPT = """You are AetherDocs AI, an intelligent document assistant embedded inside Aetherflows Studio.
You have access to the user's fully processed documents listed below. Answer questions about vendors, amounts, dates, line items, contracts, receipts, IDs, or any data found in the documents — accurately and concisely.
If the answer is not in the documents, say so clearly. Do not make up data. Keep replies brief and helpful.

DOCUMENTS CONTEXT:
{documents_context}"""


@router.post("/api/chat/documents")
async def chat_with_documents(req: ChatRequest):
    try:
        resp = supabase.table("documents") \
            .select("file_name, document_type, created_at, extracted_data") \
            .eq("status", "done") \
            .order("created_at", desc=True) \
            .execute()
        docs = resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load documents: {e}")

    documents_context = build_documents_context(docs)

    if not docs:
        return {
            "reply": "No processed documents found yet. Upload and process some documents first, then I can answer questions about them."
        }

    history_contents = []
    for msg in req.conversation_history:
        role = "user" if msg.role == "user" else "model"
        history_contents.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )
    history_contents.append(
        types.Content(role="user", parts=[types.Part(text=req.message)])
    )

    try:
        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=history_contents,
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_PROMPT.format(
                    documents_context=documents_context
                ),
                max_output_tokens=1024,
                temperature=0.3,
            ),
        )
        reply = (response.text or "").strip()
        if not reply:
            reply = "I couldn't generate a response. Please try again."
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
            reply = "I'm currently over my API quota. Please try again in a moment."
        else:
            reply = "I'm having trouble accessing your documents right now. Please try again."

    return {"reply": reply}


# ─── Invoice Draft ───────────────────────────────────────────────────────────

INVOICE_DRAFT_SYSTEM = """You are an AI invoice line-item assistant.
Convert the user's natural language request into a JSON list of invoice line items.
If the prompt doesn't specify prices, estimate reasonable market rates.

Return ONLY a valid JSON object with this exact shape (no markdown, no extra text):
{
  "lineItems": [
    { "description": "item description", "quantity": 1, "unitPrice": 50.0, "total": 50.0 }
  ]
}"""


@router.post("/api/invoice/draft")
async def draft_invoice(req: InvoiceDraftRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Content(role="user", parts=[types.Part(text=req.prompt)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=INVOICE_DRAFT_SYSTEM,
                max_output_tokens=1024,
                temperature=0.2,
            ),
        )
        raw = (response.text or "").strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            raise ValueError("No JSON object found in model response")

        parsed = json.loads(match.group(0))
        line_items = parsed.get("lineItems") or parsed.get("line_items") or []

        normalised = []
        for item in line_items:
            qty = float(item.get("quantity", 1) or 1)
            price = float(item.get("unitPrice", item.get("unit_price", 0)) or 0)
            normalised.append({
                "description": str(item.get("description", "")),
                "quantity": qty,
                "unitPrice": price,
                "total": round(qty * price, 2),
            })

        return {"lineItems": normalised}

    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            raise HTTPException(status_code=429, detail="AI quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice draft: {err}")
