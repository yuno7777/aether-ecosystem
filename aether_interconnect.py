"""
Aether Interconnect — shared cross-module service layer.
All FastAPI services import and call functions from this module.
"""
import os
import logging
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("AetherInterconnect")

# ─── Config Validation ────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Aether Interconnect startup failed — "
        "missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) "
        "and/or SUPABASE_SERVICE_ROLE_KEY in .env"
    )

from supabase import create_client, Client

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Aether Interconnect layer initialized — all modules linked")

# ─── Internal Helpers ─────────────────────────────────────────────────────────


def _log_event(
    event_type: str,
    source_module: str,
    target_module: str,
    payload: dict,
    status: str = "success",
    error_message: str | None = None,
) -> None:
    """Write a cross-module event to aether_event_log. Never raises."""
    try:
        supabase.table("aether_event_log").insert({
            "event_type":     event_type,
            "source_module":  source_module,
            "target_module":  target_module,
            "payload":        payload,
            "status":         status,
            "error_message":  error_message,
        }).execute()
    except Exception as exc:
        logger.warning(f"[interconnect] event log write failed: {exc}")


def _find_or_create_vendor(name: str | None, gstin: str | None) -> str | None:
    """Return vendor id, creating a new record if none matches by GSTIN or name."""
    try:
        if gstin:
            resp = supabase.table("vendors").select("id").eq("gstin", gstin).limit(1).execute()
            if resp.data:
                return resp.data[0]["id"]
        if name:
            resp = supabase.table("vendors").select("id").eq("name", name).limit(1).execute()
            if resp.data:
                return resp.data[0]["id"]
        # Create new vendor
        payload: dict = {"name": name or "Unknown Vendor"}
        if gstin:
            payload["gstin"] = gstin
        resp = supabase.table("vendors").insert(payload).execute()
        return resp.data[0]["id"] if resp.data else None
    except Exception as exc:
        logger.warning(f"[interconnect] _find_or_create_vendor error: {exc}")
        return None


def _find_or_create_client(
    name: str | None,
    email: str | None = None,
    phone: str | None = None,
) -> str | None:
    """Return client id, creating a new record if none matches."""
    try:
        if email:
            resp = supabase.table("clients").select("id").eq("email", email).limit(1).execute()
            if resp.data:
                return resp.data[0]["id"]
        if phone:
            resp = supabase.table("clients").select("id").eq("phone", phone).limit(1).execute()
            if resp.data:
                return resp.data[0]["id"]
        if name:
            resp = supabase.table("clients").select("id").eq("name", name).limit(1).execute()
            if resp.data:
                return resp.data[0]["id"]
        # Create new client
        payload: dict = {"name": name or "Unknown Client"}
        if email:
            payload["email"] = email
        if phone:
            payload["phone"] = phone
        resp = supabase.table("clients").insert(payload).execute()
        return resp.data[0]["id"] if resp.data else None
    except Exception as exc:
        logger.warning(f"[interconnect] _find_or_create_client error: {exc}")
        return None


# ─── Core Interconnect Functions ──────────────────────────────────────────────


async def on_document_processed(document_id: str, extracted_data: dict) -> dict:
    """
    Called by AetherDocs after Gemini extracts invoice data from a document.
    Matches/creates vendor and client, inserts into invoices, optionally
    pushes line items to Aether Supply.
    """
    try:
        vendor_name  = extracted_data.get("vendor_name")
        gstin        = extracted_data.get("gstin") or extracted_data.get("gstin_number")
        client_name  = extracted_data.get("client_name") or extracted_data.get("buyer_name")
        client_email = extracted_data.get("client_email")

        vendor_id = _find_or_create_vendor(vendor_name, gstin)
        client_id = _find_or_create_client(client_name, client_email)

        invoice_payload: dict = {
            "document_id":      document_id,
            "vendor_id":        vendor_id,
            "client_id":        client_id,
            "invoice_number":   extracted_data.get("invoice_number"),
            "invoice_date":     extracted_data.get("date") or extracted_data.get("invoice_date"),
            "due_date":         extracted_data.get("due_date"),
            "total_amount":     extracted_data.get("total_amount"),
            "tax_amount":       extracted_data.get("tax_amount"),
            "gstin":            gstin,
            "line_items":       extracted_data.get("line_items"),
            "pushed_to_tax":    False,
            "pushed_to_supply": False,
        }
        # Strip None values for optional fields to avoid type errors
        clean = {k: v for k, v in invoice_payload.items() if v is not None}
        supabase.table("invoices").insert(clean).execute()

        # If line items are present, push each item as a stock entry to Aether Supply
        line_items = extracted_data.get("line_items") or []
        supply_pushed = 0
        for item in line_items:
            desc = item.get("description", "")
            qty  = item.get("quantity", 0)
            if desc and qty:
                # Try to match existing product by name; if missing skip (no auto-create for supply items)
                resp = supabase.table("products").select("id, stock_quantity").ilike("name", f"%{desc}%").limit(1).execute()
                if resp.data:
                    product = resp.data[0]
                    new_stock = int(product["stock_quantity"]) + int(qty)
                    supabase.table("products").update({
                        "stock_quantity":  new_stock,
                        "is_out_of_stock": new_stock <= 0,
                        "updated_at":      datetime.utcnow().isoformat(),
                    }).eq("id", product["id"]).execute()
                    supply_pushed += 1

        _log_event(
            "document_processed", "AetherDocs", "AetherCRM",
            {"document_id": document_id, "vendor_id": vendor_id, "client_id": client_id},
        )

        return {
            "status": "ok",
            "vendor_id":     vendor_id,
            "client_id":     client_id,
            "supply_pushed": supply_pushed,
        }

    except Exception as exc:
        logger.error(f"[interconnect] on_document_processed: {exc}")
        _log_event(
            "document_processed", "AetherDocs", "AetherCRM",
            {"document_id": document_id}, "failed", str(exc),
        )
        return {"status": "error", "error": str(exc)}


async def on_tax_anomaly_detected(gstin: str, anomaly_score: float) -> dict:
    """
    Called by AetherTax after Isolation Forest scoring.
    Updates vendor compliance_risk; sets compliance_alert on linked clients.
    """
    try:
        if anomaly_score > 0.7:
            risk = "high"
        elif anomaly_score > 0.5:
            risk = "medium"
        else:
            risk = "low"

        is_compliant = risk != "high"

        # Update vendor
        vendor_resp = (
            supabase.table("vendors")
            .update({"compliance_risk": risk, "is_gst_compliant": is_compliant})
            .eq("gstin", gstin)
            .execute()
        )
        vendor_ids = [r["id"] for r in (vendor_resp.data or [])]

        # Find all invoices linking this vendor to clients
        clients_alerted = 0
        if risk in ("high", "medium"):
            inv_resp = (
                supabase.table("invoices")
                .select("client_id")
                .eq("gstin", gstin)
                .execute()
            )
            client_ids = list({r["client_id"] for r in (inv_resp.data or []) if r.get("client_id")})
            for cid in client_ids:
                supabase.table("clients").update({
                    "compliance_alert": True,
                    "updated_at":       datetime.utcnow().isoformat(),
                }).eq("id", cid).execute()
                clients_alerted += 1

        _log_event(
            "tax_anomaly_detected", "AetherTax", "AetherCRM",
            {"gstin": gstin, "anomaly_score": anomaly_score, "risk": risk},
        )

        return {
            "status":          "ok",
            "gstin":           gstin,
            "risk":            risk,
            "vendors_updated": len(vendor_ids),
            "clients_alerted": clients_alerted,
        }

    except Exception as exc:
        logger.error(f"[interconnect] on_tax_anomaly_detected: {exc}")
        _log_event(
            "tax_anomaly_detected", "AetherTax", "AetherCRM",
            {"gstin": gstin}, "failed", str(exc),
        )
        return {"status": "error", "error": str(exc)}


async def on_stock_low(product_id: str, current_stock: int) -> dict:
    """
    Called by Aether Supply when stock hits the reorder threshold.
    Updates is_out_of_stock flag and logs a reorder alert.
    """
    try:
        resp = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        if not resp.data:
            return {"status": "error", "error": "product_not_found"}

        product = resp.data[0]
        is_out  = current_stock <= 0

        supabase.table("products").update({
            "stock_quantity":  current_stock,
            "is_out_of_stock": is_out,
            "updated_at":      datetime.utcnow().isoformat(),
        }).eq("id", product_id).execute()

        _log_event(
            "stock_low", "AetherSupply", "AetherCommerce",
            {
                "product_id":    product_id,
                "product_name":  product.get("name"),
                "current_stock": current_stock,
                "is_out":        is_out,
                "reorder_threshold": product.get("reorder_threshold"),
            },
        )

        return {
            "status":       "ok",
            "product":      product,
            "current_stock": current_stock,
            "is_out_of_stock": is_out,
        }

    except Exception as exc:
        logger.error(f"[interconnect] on_stock_low: {exc}")
        _log_event(
            "stock_low", "AetherSupply", "AetherCommerce",
            {"product_id": product_id}, "failed", str(exc),
        )
        return {"status": "error", "error": str(exc)}


async def on_whatsapp_order(
    phone: str,
    product_id: str,
    quantity: int,
    amount: float,
) -> dict:
    """
    Called by AetherCommerce when a WhatsApp order is placed.
    Finds or creates client by phone, then inserts the order.
    Stock decrement is handled by the DB trigger.
    """
    try:
        client_id = _find_or_create_client(name=None, phone=phone)

        order_resp = supabase.table("orders").insert({
            "client_id":   client_id,
            "product_id":  product_id,
            "quantity":    quantity,
            "total_amount": amount,
            "status":      "confirmed",
            "channel":     "whatsapp",
        }).execute()

        order_id = order_resp.data[0]["id"] if order_resp.data else None

        _log_event(
            "whatsapp_order", "AetherCommerce", "AetherSupply",
            {"phone": phone, "product_id": product_id, "quantity": quantity, "amount": amount},
        )

        return {"status": "ok", "order_id": order_id, "client_id": client_id}

    except Exception as exc:
        logger.error(f"[interconnect] on_whatsapp_order: {exc}")
        _log_event(
            "whatsapp_order", "AetherCommerce", "AetherSupply",
            {"phone": phone, "product_id": product_id}, "failed", str(exc),
        )
        return {"status": "error", "error": str(exc)}


async def on_sdr_action(lead_id: str, action: str) -> dict:
    """
    Called by AetherSDR after each outreach action.
    Actions: email_sent | call_made | meeting_booked | no_reply
    - no_reply after 3 attempts → status = lost
    - meeting_booked transition is handled by DB trigger (leads → clients)
    """
    try:
        resp = supabase.table("leads").select("*").eq("id", lead_id).limit(1).execute()
        if not resp.data:
            return {"status": "error", "error": "lead_not_found"}

        lead = resp.data[0]

        action_to_status = {
            "email_sent":     "contacted",
            "call_made":      "contacted",
            "meeting_booked": "meeting_booked",
            "replied":        "replied",
            "no_reply":       lead.get("status", "contacted"),
        }
        new_status = action_to_status.get(action, lead.get("status", "contacted"))

        update: dict = {
            "sdr_last_action":    action,
            "sdr_last_action_at": datetime.utcnow().isoformat(),
        }

        if action == "no_reply":
            attempt_count = int(lead.get("sdr_attempt_count", 0)) + 1
            update["sdr_attempt_count"] = attempt_count
            if attempt_count >= 3 and lead.get("status") not in ("won", "meeting_booked"):
                new_status = "lost"
        else:
            update["sdr_attempt_count"] = 0

        if new_status != lead.get("status"):
            update["status"] = new_status

        supabase.table("leads").update(update).eq("id", lead_id).execute()

        _log_event(
            "sdr_action", "AetherSDR", "AetherCRM",
            {"lead_id": lead_id, "action": action, "new_status": new_status},
        )

        return {"status": "ok", "lead_id": lead_id, "new_status": new_status}

    except Exception as exc:
        logger.error(f"[interconnect] on_sdr_action: {exc}")
        _log_event(
            "sdr_action", "AetherSDR", "AetherCRM",
            {"lead_id": lead_id, "action": action}, "failed", str(exc),
        )
        return {"status": "error", "error": str(exc)}


async def get_client_full_profile(client_id: str) -> dict:
    """
    Master function called by AetherCRM.
    Returns a single unified response with all cross-module data for a client.
    """
    try:
        # Base client record
        c_resp = supabase.table("clients").select("*").eq("id", client_id).limit(1).execute()
        if not c_resp.data:
            return {"status": "error", "error": "client_not_found"}
        client = c_resp.data[0]

        # All invoices
        inv_resp = (
            supabase.table("invoices")
            .select("*, vendors(name, gstin, compliance_risk, is_gst_compliant)")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
        )
        invoices = inv_resp.data or []

        # All orders
        ord_resp = (
            supabase.table("orders")
            .select("*, products(name, sku, category)")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
        )
        orders = ord_resp.data or []

        # SDR / Lead records
        lead_resp = (
            supabase.table("leads")
            .select("*")
            .eq("client_id", client_id)
            .order("created_at", desc=True)
            .execute()
        )
        leads = lead_resp.data or []

        # GST compliance — gather from linked vendors via invoices
        vendor_gstins = list({inv.get("gstin") for inv in invoices if inv.get("gstin")})
        gst_risk      = "low"
        gst_details: list[dict] = []
        if vendor_gstins:
            gst_resp = (
                supabase.table("gst_invoices")
                .select("gstin, anomaly_score, is_flagged, status, vendor_name")
                .in_("gstin", vendor_gstins)
                .order("anomaly_score", desc=True)
                .limit(20)
                .execute()
            )
            gst_details = gst_resp.data or []
            if any(r.get("is_flagged") for r in gst_details):
                gst_risk = "high"
            elif any(float(r.get("anomaly_score") or 0) > 0.5 for r in gst_details):
                gst_risk = "medium"

        # Vendor compliance alerts
        vendor_ids = list({inv.get("vendor_id") for inv in invoices if inv.get("vendor_id")})
        vendor_alerts: list[dict] = []
        if vendor_ids:
            vend_resp = (
                supabase.table("vendors")
                .select("id, name, gstin, compliance_risk, is_gst_compliant")
                .in_("id", vendor_ids)
                .neq("compliance_risk", "low")
                .execute()
            )
            vendor_alerts = vend_resp.data or []

        return {
            "status":          "ok",
            "client":          client,
            "invoices":        invoices,
            "orders":          orders,
            "leads":           leads,
            "gst_risk":        gst_risk,
            "gst_details":     gst_details,
            "vendor_alerts":   vendor_alerts,
            "summary": {
                "total_invoices":   len(invoices),
                "total_orders":     len(orders),
                "total_leads":      len(leads),
                "compliance_alert": client.get("compliance_alert", False),
            },
        }

    except Exception as exc:
        logger.error(f"[interconnect] get_client_full_profile: {exc}")
        return {"status": "error", "error": str(exc)}
