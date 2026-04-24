"""
Aether Interconnect Router — mounts under /api/interconnect
"""
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from aether_interconnect import (
    on_document_processed,
    on_tax_anomaly_detected,
    on_stock_low,
    on_whatsapp_order,
    on_sdr_action,
    get_client_full_profile,
    supabase,
)

logger = logging.getLogger("AetherInterconnect.Router")

router = APIRouter(prefix="/api/interconnect", tags=["interconnect"])


# ─── Request / Response Models ────────────────────────────────────────────────


class DocumentProcessedRequest(BaseModel):
    document_id:    str
    extracted_data: dict


class TaxAnomalyRequest(BaseModel):
    gstin:         str
    anomaly_score: float


class StockLowRequest(BaseModel):
    product_id:    str
    current_stock: int


class WhatsappOrderRequest(BaseModel):
    phone:      str
    product_id: str
    quantity:   int
    amount:     float


class SdrActionRequest(BaseModel):
    lead_id: str
    action:  str  # email_sent | call_made | meeting_booked | no_reply | replied


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/document-processed")
async def route_document_processed(req: DocumentProcessedRequest, bg: BackgroundTasks):
    """AetherDocs → after Gemini extraction, trigger cross-module fan-out."""
    bg.add_task(on_document_processed, req.document_id, req.extracted_data)
    return {"status": "accepted", "document_id": req.document_id}


@router.post("/tax-anomaly")
async def route_tax_anomaly(req: TaxAnomalyRequest, bg: BackgroundTasks):
    """AetherTax → after scoring, propagate vendor/client compliance updates."""
    bg.add_task(on_tax_anomaly_detected, req.gstin, req.anomaly_score)
    return {"status": "accepted", "gstin": req.gstin}


@router.post("/stock-low")
async def route_stock_low(req: StockLowRequest):
    """Aether Supply → stock hit reorder threshold, update flag and notify Commerce."""
    result = await on_stock_low(req.product_id, req.current_stock)
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/whatsapp-order")
async def route_whatsapp_order(req: WhatsappOrderRequest):
    """AetherCommerce → WhatsApp order placed, find/create client and record order."""
    result = await on_whatsapp_order(req.phone, req.product_id, req.quantity, req.amount)
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/sdr-action")
async def route_sdr_action(req: SdrActionRequest, bg: BackgroundTasks):
    """AetherSDR → outreach action recorded, update lead status."""
    bg.add_task(on_sdr_action, req.lead_id, req.action)
    return {"status": "accepted", "lead_id": req.lead_id, "action": req.action}


@router.get("/client-profile/{client_id}")
async def route_client_profile(client_id: str):
    """AetherCRM → fetch unified client profile across all modules."""
    result = await get_client_full_profile(client_id)
    if result.get("status") == "error":
        detail = result["error"]
        status_code = 404 if "not_found" in detail else 500
        raise HTTPException(status_code=status_code, detail=detail)
    return result


@router.get("/health")
async def route_health():
    """Return reachability status and record counts for all 6 modules."""
    modules = {
        "AetherCRM":      {"table": "clients"},
        "AetherDocs":     {"table": "documents"},
        "AetherTax":      {"table": "gst_invoices"},
        "AetherSupply":   {"table": "products"},
        "AetherSDR":      {"table": "leads"},
        "AetherCommerce": {"table": "orders"},
    }

    results: dict = {}
    overall = "ok"

    for module_name, cfg in modules.items():
        try:
            resp = supabase.table(cfg["table"]).select("id", count="exact").limit(1).execute()
            results[module_name] = {
                "status": "ok",
                "table":  cfg["table"],
                "count":  resp.count if resp.count is not None else len(resp.data or []),
            }
        except Exception as exc:
            results[module_name] = {"status": "unreachable", "error": str(exc)}
            overall = "degraded"

    # Event log count
    try:
        elog = supabase.table("aether_event_log").select("id", count="exact").limit(1).execute()
        results["EventLog"] = {
            "status": "ok",
            "table":  "aether_event_log",
            "count":  elog.count if elog.count is not None else len(elog.data or []),
        }
    except Exception as exc:
        results["EventLog"] = {"status": "unreachable", "error": str(exc)}

    return {"status": overall, "modules": results}
