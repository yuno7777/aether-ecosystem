"""
Aether Agent Routes - SDR and Commerce orchestration APIs.
Mounted under /api/agents
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger("AetherAgents")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing Supabase configuration for agent routes")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

_genai_client = None
_genai_types = None
if GEMINI_API_KEY:
    try:
        from google import genai
        from google.genai import types

        _genai_client = genai.Client(api_key=GEMINI_API_KEY)
        _genai_types = types
    except Exception as exc:  # pragma: no cover - import guard
        logger.warning(f"Gemini client init failed, falling back to deterministic responses: {exc}")

router = APIRouter(prefix="/api/agents", tags=["agents"])


class SdrInsightRequest(BaseModel):
    summary: dict[str, Any]


class LeadScoreRequest(BaseModel):
    lead: dict[str, Any]


class EmailDraftRequest(BaseModel):
    lead: dict[str, Any] | None = None
    goal: str = "Introduce Aether's CRM and supply stack in a concise first-touch email."


class CommerceBriefRequest(BaseModel):
    summary: dict[str, Any]


class CommerceReplyRequest(BaseModel):
    message_context: str
    catalog_snippet: str = ""


class CommerceBroadcastRequest(BaseModel):
    product: dict[str, Any]
    campaign_name: str = "General Promotion"
    extra_context: str = ""


class CommerceTranslateRequest(BaseModel):
    text: str
    target_language: str = "Hindi"


class SyncSupplyToCrmRequest(BaseModel):
    limit: int = Field(default=300, ge=1, le=2000)


def _safe_str(v: Any, default: str = "") -> str:
    if v is None:
        return default
    return str(v).strip()


def _gemini_text(prompt: str, system_instruction: str | None = None) -> str:
    if not _genai_client or not _genai_types:
        raise RuntimeError("Gemini is not configured on backend")

    cfg = _genai_types.GenerateContentConfig(
        max_output_tokens=700,
        temperature=0.3,
        system_instruction=system_instruction,
    )
    response = _genai_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=cfg,
    )
    return (response.text or "").strip()


def _fetch_clients(limit: int = 200) -> list[dict[str, Any]]:
    resp = supabase.table("clients").select("*").order("created_at", desc=True).limit(limit).execute()
    rows = resp.data or []
    clients: list[dict[str, Any]] = []
    for row in rows:
        clients.append(
            {
                "id": _safe_str(row.get("id")),
                "name": _safe_str(row.get("name"), "Unknown Client"),
                "company": _safe_str(row.get("company")) or _safe_str(row.get("organization")),
                "email": _safe_str(row.get("email")),
                "phone": _safe_str(row.get("phone")),
                "status": _safe_str(row.get("status"), "Active"),
                "created_at": row.get("created_at"),
            }
        )
    return clients


def _fetch_deals(limit: int = 200) -> list[dict[str, Any]]:
    try:
        resp = supabase.table("deals").select("*").order("created_at", desc=True).limit(limit).execute()
        rows = resp.data or []
    except Exception:
        rows = []

    deals: list[dict[str, Any]] = []
    for row in rows:
        stage = _safe_str(row.get("stage_id")) or _safe_str(row.get("stageId")) or "lead"
        deals.append(
            {
                "id": _safe_str(row.get("id")),
                "client": _safe_str(row.get("client")) or _safe_str(row.get("client_name")),
                "value": float(row.get("value") or row.get("amount") or 0),
                "days": int(row.get("days") or 0),
                "stage_id": stage,
            }
        )
    return deals


def _fetch_products(limit: int = 300) -> list[dict[str, Any]]:
    resp = supabase.table("products").select("*").order("name", desc=False).limit(limit).execute()
    rows = resp.data or []
    products: list[dict[str, Any]] = []
    for row in rows:
        products.append(
            {
                "id": _safe_str(row.get("id")),
                "name": _safe_str(row.get("name")),
                "sku": _safe_str(row.get("sku")),
                "category": _safe_str(row.get("category"), "Uncategorized"),
                "stock_quantity": int(row.get("stock_quantity") or row.get("stock") or 0),
                "selling_price": float(row.get("price") or row.get("selling_price") or 0),
                "is_out_of_stock": bool(row.get("is_out_of_stock", False)),
            }
        )
    return products


def _extract_supply_contact(order: dict[str, Any]) -> dict[str, str]:
    name = (
        _safe_str(order.get("customer_name"))
        or _safe_str(order.get("client_name"))
        or _safe_str(order.get("buyer_name"))
        or _safe_str(order.get("name"))
    )
    email = _safe_str(order.get("customer_email")) or _safe_str(order.get("email"))
    phone = _safe_str(order.get("customer_phone")) or _safe_str(order.get("phone"))
    company = _safe_str(order.get("company")) or _safe_str(order.get("organization"))

    if not name and phone:
        name = f"Customer {phone[-4:]}"
    elif not name and email:
        name = email.split("@")[0].replace(".", " ").title()

    return {"name": name, "email": email, "phone": phone, "company": company}


def _find_client_id(email: str, phone: str, name: str) -> str | None:
    try:
        if email:
            by_email = supabase.table("clients").select("id").eq("email", email).limit(1).execute()
            if by_email.data:
                return _safe_str(by_email.data[0].get("id"))
        if phone:
            by_phone = supabase.table("clients").select("id").eq("phone", phone).limit(1).execute()
            if by_phone.data:
                return _safe_str(by_phone.data[0].get("id"))
        if name:
            by_name = supabase.table("clients").select("id").eq("name", name).limit(1).execute()
            if by_name.data:
                return _safe_str(by_name.data[0].get("id"))
    except Exception as exc:
        logger.warning(f"Failed to lookup existing client: {exc}")
    return None


def _sync_supply_to_crm(limit: int = 300) -> dict[str, Any]:
    try:
        orders_resp = (
            supabase.table("orders")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch supply orders: {exc}")

    orders = orders_resp.data or []
    created = 0
    linked = 0
    skipped = 0
    failed = 0

    for order in orders:
        try:
            current_client_id = _safe_str(order.get("client_id"))
            if current_client_id:
                linked += 1
                continue

            contact = _extract_supply_contact(order)
            name = contact["name"]
            email = contact["email"]
            phone = contact["phone"]
            company = contact["company"]

            if not (name or email or phone):
                skipped += 1
                continue

            client_id = _find_client_id(email, phone, name)
            if not client_id:
                payload = {
                    "name": name or "Supply Customer",
                    "email": email or None,
                    "phone": phone or None,
                    "company": company or None,
                    "status": "Active",
                }
                clean = {k: v for k, v in payload.items() if v is not None}
                created_resp = supabase.table("clients").insert(clean).execute()
                if not created_resp.data:
                    failed += 1
                    continue
                client_id = _safe_str(created_resp.data[0].get("id"))
                created += 1

            supabase.table("orders").update({"client_id": client_id}).eq("id", order.get("id")).execute()
            linked += 1
        except Exception as exc:
            logger.warning(f"Supply->CRM sync failed for order {order.get('id')}: {exc}")
            failed += 1

    return {
        "orders_scanned": len(orders),
        "clients_created": created,
        "orders_linked": linked,
        "orders_skipped": skipped,
        "orders_failed": failed,
    }


def _fallback_sdr_insight(summary: dict[str, Any]) -> str:
    total_clients = int(summary.get("totalClients", 0))
    open_deals = int(summary.get("totalDeals", 0))
    won_deals = int(summary.get("wonDeals", 0))
    revenue = float(summary.get("totalRevenue", 0))
    return (
        f"Pipeline snapshot: {total_clients} clients and {open_deals} active deals, with {won_deals} wins and "
        f"estimated pipeline value of ₹{revenue:,.0f}. Prioritize high-value accounts with no recent outreach "
        f"and run a focused follow-up cadence on stalled opportunities this week."
    )


def _fallback_commerce_brief(summary: dict[str, Any]) -> str:
    products = int(summary.get("products", 0))
    low_stock = int(summary.get("lowStock", 0))
    clients = int(summary.get("clients", 0))
    return (
        f"Commerce health: {products} products tracked, {low_stock} below threshold, and {clients} CRM contacts available "
        "for campaigns. Reduce stock risk by prioritizing replenishment for fast-moving SKUs and target active clients "
        "with inventory-backed promotions."
    )


@router.post("/sync/supply-to-crm")
async def sync_supply_to_crm(req: SyncSupplyToCrmRequest):
    result = _sync_supply_to_crm(limit=req.limit)
    return {"status": "ok", **result}


@router.get("/sdr/context")
async def get_sdr_context(sync_supply_to_crm: bool = True):
    sync_result = None
    if sync_supply_to_crm:
        sync_result = _sync_supply_to_crm(limit=250)

    clients = _fetch_clients(limit=150)
    deals = _fetch_deals(limit=150)
    products = _fetch_products(limit=200)

    response = {
        "clients": clients,
        "deals": deals,
        "supply_summary": {
            "products": len(products),
            "low_stock": len([p for p in products if p["stock_quantity"] < 20]),
        },
    }
    if sync_result is not None:
        response["sync"] = sync_result
    return response


@router.post("/sdr/insight")
async def get_sdr_insight(req: SdrInsightRequest):
    prompt = (
        "You are an AI SDR analyst. Given this CRM and supply snapshot JSON, write exactly 3 concise bullets "
        "on pipeline health, risk, and next best actions. Use plain text only.\n\n"
        f"{json.dumps(req.summary)}"
    )
    try:
        text = _gemini_text(prompt, system_instruction="Keep response under 120 words.")
    except Exception:
        text = _fallback_sdr_insight(req.summary)
    return {"insight": text}


@router.post("/sdr/score")
async def score_sdr_lead(req: LeadScoreRequest):
    prompt = (
        "Rate this lead from 0-100 for SDR outreach potential. "
        "Return ONLY a number.\n\n"
        f"{json.dumps(req.lead)}"
    )
    try:
        text = _gemini_text(prompt)
        score = int("".join(ch for ch in text if ch.isdigit()) or "70")
    except Exception:
        score = 70
    score = max(10, min(100, score))
    return {"score": score}


@router.post("/sdr/draft-email")
async def draft_sdr_email(req: EmailDraftRequest):
    lead = req.lead or {}
    prompt = (
        "Draft a personalized B2B cold email for an SDR.\n"
        f"Lead: {json.dumps(lead)}\n"
        f"Goal: {req.goal}\n"
        "Output format: Subject line followed by body. Plain text. Max 120 words. Sign off as Aether Team."
    )
    try:
        draft = _gemini_text(prompt)
    except Exception:
        name = _safe_str(lead.get("name"), "there")
        company = _safe_str(lead.get("company"), "your team")
        draft = (
            f"Subject: Quick idea for {company}\n\n"
            f"Hi {name},\n\n"
            "We help teams unify CRM + supply operations so sales and fulfillment stay in sync. "
            "If useful, I can share a short walkthrough tailored to your workflow and current growth goals.\n\n"
            "Best,\nAether Team"
        )
    return {"draft": draft}


@router.get("/commerce/context")
async def get_commerce_context(sync_supply_to_crm: bool = True):
    sync_result = None
    if sync_supply_to_crm:
        sync_result = _sync_supply_to_crm(limit=300)

    products = _fetch_products(limit=300)
    clients = _fetch_clients(limit=200)

    response = {"products": products, "clients": clients}
    if sync_result is not None:
        response["sync"] = sync_result
    return response


@router.post("/commerce/brief")
async def get_commerce_brief(req: CommerceBriefRequest):
    prompt = (
        "You are a commerce analytics assistant. Create a 2-sentence executive brief with action items "
        "based on this JSON snapshot:\n\n"
        f"{json.dumps(req.summary)}"
    )
    try:
        brief = _gemini_text(prompt)
    except Exception:
        brief = _fallback_commerce_brief(req.summary)
    return {"brief": brief}


@router.post("/commerce/reply-suggestion")
async def get_commerce_reply(req: CommerceReplyRequest):
    prompt = (
        "Write a short empathetic WhatsApp support reply under 60 words.\n"
        f"Conversation context: {req.message_context}\n"
        f"Catalog context: {req.catalog_snippet}"
    )
    try:
        suggestion = _gemini_text(prompt)
    except Exception:
        suggestion = (
            "Thanks for flagging this. I can help right away - please share the updated delivery address and "
            "I’ll get your order details corrected from our side."
        )
    return {"suggestion": suggestion.strip()}


@router.post("/commerce/broadcast")
async def generate_commerce_broadcast(req: CommerceBroadcastRequest):
    prompt = (
        "Write a WhatsApp broadcast message under 100 words with emojis and a CTA. Use {{Name}} placeholder.\n"
        f"Product JSON: {json.dumps(req.product)}\n"
        f"Campaign name: {req.campaign_name}\n"
        f"Extra context: {req.extra_context}"
    )
    try:
        message = _gemini_text(
            prompt,
            system_instruction="You are a conversion-focused Indian commerce marketer.",
        )
    except Exception:
        product_name = _safe_str(req.product.get("name"), "our product")
        price = float(req.product.get("selling_price") or 0)
        message = (
            f"Hi {{Name}}! {product_name} is now available at ₹{price:,.0f}. "
            "Limited stock and fast delivery slots are open today. Reply YES to book yours now."
        )
    return {"message": message.strip()}


@router.post("/commerce/translate")
async def translate_commerce_message(req: CommerceTranslateRequest):
    prompt = (
        f"Translate this message to {req.target_language}. Keep emojis and {{Name}} placeholder intact. "
        "Only return the translated message.\n\n"
        f"{req.text}"
    )
    try:
        translated = _gemini_text(prompt)
    except Exception:
        translated = req.text
    return {"message": translated.strip()}
