"""
AetherTax Routes — GST reconciliation, anomaly detection, Gemini advisory.
Mounted under /api/tax
"""
import os
import io
import json
import math
import logging
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from dotenv import load_dotenv
import httpx

load_dotenv()

logger = logging.getLogger("AetherTax")

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.1-flash-lite-preview"

from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

from google import genai
from google.genai import types
genai_client = genai.Client(api_key=GEMINI_API_KEY)

from ml.train_model import load_or_train
from ml.scorer import score_invoice

ml_model, ml_scaler = load_or_train()

# ─── Router ──────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/tax", tags=["tax"])

# ─── Helpers ─────────────────────────────────────────────────────────────────


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(file_bytes))
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    renames = {}
    for col in df.columns:
        if col in ("invoice_no", "inv_no", "inv_number"):
            renames[col] = "invoice_number"
        if col in ("vendor", "supplier_name", "party_name"):
            renames[col] = "vendor_name"
        if col in ("amount", "taxable_value", "invoice_value"):
            renames[col] = "value"
        if col in ("date", "inv_date"):
            renames[col] = "invoice_date"
    if renames:
        df.rename(columns=renames, inplace=True)
    return df


def reconcile(gstr1: pd.DataFrame, gstr2b: pd.DataFrame) -> list[dict]:
    """Merge GSTR-1 and GSTR-2B on invoice_number + gstin; compute status."""
    key = ["invoice_number", "gstin"]

    g1 = gstr1[key + ["vendor_name", "value", "invoice_date"]].copy()
    g1.rename(columns={"value": "value_books", "vendor_name": "vendor_name_1", "invoice_date": "invoice_date_1"}, inplace=True)

    g2 = gstr2b[key + ["value"]].copy()
    g2.rename(columns={"value": "value_portal"}, inplace=True)

    merged = pd.merge(g1, g2, on=key, how="outer", indicator=True)

    rows = []
    for _, row in merged.iterrows():
        raw_books = row.get("value_books")
        raw_portal = row.get("value_portal")
        val_books = 0.0 if pd.isna(raw_books) else float(raw_books)
        val_portal = 0.0 if pd.isna(raw_portal) else float(raw_portal)

        raw_date = row.get("invoice_date_1")
        inv_date = "" if pd.isna(raw_date) else str(raw_date)

        source = str(row.get("_merge", "both"))
        if source == "left_only":
            status = "missing_2b"
        elif source == "right_only":
            status = "missing_books"
        elif abs(val_books - val_portal) > 1:
            status = "value_mismatch"
        else:
            status = "matched"

        period = inv_date[:7] if len(inv_date) >= 7 else None

        record = {
            "invoice_number": str(row.get("invoice_number") or ""),
            "vendor_name": str(row.get("vendor_name_1") or ""),
            "gstin": str(row.get("gstin") or ""),
            "value_books": val_books,
            "value_portal": val_portal,
            "invoice_date": inv_date[:10] if len(inv_date) >= 10 else None,
            "status": status,
            "source": source,
            "period": period,
        }

        anomaly_score = score_invoice(record, ml_model, ml_scaler)
        if not isinstance(anomaly_score, float) or anomaly_score != anomaly_score:
            anomaly_score = 0.5
        record["anomaly_score"] = round(float(anomaly_score), 4)
        record["is_flagged"] = record["anomaly_score"] > 0.7

        rows.append(record)

    return rows


async def _notify_tax_anomalies(anomalous_records: list[dict]) -> None:
    """Fire-and-forget: push each anomalous invoice's GSTIN to the interconnect layer."""
    from aether_interconnect import on_tax_anomaly_detected
    for record in anomalous_records:
        gstin = record.get("gstin")
        score = record.get("anomaly_score", 0.0)
        if not gstin:
            continue
        try:
            await on_tax_anomaly_detected(gstin, score)
        except Exception as exc:
            logger.warning(f"Interconnect tax-anomaly notify failed for {gstin}: {exc}")


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.get("/health")
async def health():
    return {"status": "ok", "model": GEMINI_MODEL, "ml": "loaded"}


@router.post("/sync")
async def sync_gst(
    gstr1: UploadFile = File(...),
    gstr2b: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    """Upload GSTR-1 and GSTR-2B CSVs, reconcile, score anomalies, upsert to Supabase."""
    try:
        g1_bytes = await gstr1.read()
        g2_bytes = await gstr2b.read()
        df1 = parse_csv(g1_bytes)
        df2 = parse_csv(g2_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    try:
        records = reconcile(df1, df2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reconciliation error: {e}")

    def _safe(v):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return 0.0
        return v

    clean_records = [{k: _safe(v) for k, v in r.items()} for r in records]

    try:
        supabase.table("gst_invoices").upsert(
            clean_records, on_conflict="invoice_number,gstin"
        ).execute()
    except Exception:
        try:
            keys = [
                {"invoice_number": r["invoice_number"], "gstin": r["gstin"]}
                for r in clean_records
                if r.get("invoice_number") and r.get("gstin")
            ]
            for key in keys:
                supabase.table("gst_invoices") \
                    .delete() \
                    .eq("invoice_number", key["invoice_number"]) \
                    .eq("gstin", key["gstin"]) \
                    .execute()
            supabase.table("gst_invoices").insert(clean_records).execute()
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Supabase persist failed: {e2}")

    total = len(clean_records)
    matched = sum(1 for r in clean_records if r["status"] == "matched")
    mismatched = sum(1 for r in clean_records if r["status"] != "matched")
    itc_at_risk = sum(r["value_books"] for r in clean_records if r["status"] in ("missing_2b", "value_mismatch"))
    high_risk_flagged = sum(1 for r in clean_records if r["is_flagged"])

    anomalous = [r for r in clean_records if float(r.get("anomaly_score", 0)) > 0.5]
    if anomalous and background_tasks is not None:
        background_tasks.add_task(_notify_tax_anomalies, anomalous)

    logger.info(f"Sync complete — {total} invoices, {high_risk_flagged} flagged")
    return {
        "total": total,
        "matched": matched,
        "mismatched": mismatched,
        "itc_at_risk": round(float(itc_at_risk), 2),
        "high_risk_flagged": high_risk_flagged,
    }


@router.get("/overview")
async def get_overview():
    """Aggregate tax figures from gst_invoices."""
    try:
        resp = supabase.table("gst_invoices").select("*").execute()
        rows = resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {e}")

    total_liability = sum(float(r.get("value_books") or 0) for r in rows)
    available_itc = sum(float(r.get("value_portal") or 0) for r in rows if r.get("status") == "matched")
    potential_itc_loss = sum(float(r.get("value_books") or 0) for r in rows if r.get("status") == "missing_2b")
    net_payable = total_liability - available_itc
    high_risk_count = sum(1 for r in rows if r.get("is_flagged"))

    return {
        "total_liability": round(total_liability, 2),
        "available_itc": round(available_itc, 2),
        "potential_itc_loss": round(potential_itc_loss, 2),
        "net_payable": round(net_payable, 2),
        "high_risk_count": high_risk_count,
    }


@router.get("/reconciliation")
async def get_reconciliation():
    """Return all invoices ordered by anomaly_score descending."""
    try:
        resp = (
            supabase.table("gst_invoices")
            .select("*")
            .order("anomaly_score", desc=True)
            .execute()
        )
        return {"invoices": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {e}")


@router.get("/notices")
async def get_notices():
    """Return all GST notices ordered by due_date ascending."""
    try:
        resp = (
            supabase.table("gst_notices")
            .select("*")
            .order("due_date", desc=False)
            .execute()
        )
        return {"notices": resp.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {e}")


@router.post("/reconcile-ai")
async def reconcile_ai():
    """Run Gemini advisory over all non-matched invoices."""
    try:
        resp = (
            supabase.table("gst_invoices")
            .select("*")
            .neq("status", "matched")
            .order("anomaly_score", desc=True)
            .execute()
        )
        mismatches = resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {e}")

    if not mismatches:
        return {"recommendations": [], "message": "All invoices matched — no action required."}

    mismatches_context = json.dumps(
        [
            {
                "invoice_number": r.get("invoice_number"),
                "vendor_name": r.get("vendor_name"),
                "gstin": r.get("gstin"),
                "value_books": r.get("value_books"),
                "value_portal": r.get("value_portal"),
                "status": r.get("status"),
                "anomaly_score": r.get("anomaly_score"),
                "period": r.get("period"),
            }
            for r in mismatches
        ],
        indent=2,
    )

    SYSTEM_PROMPT = """
You are AetherTax Compliance Advisor, an expert in Indian GST law and reconciliation.
You will receive a list of mismatched GST invoices, each with an anomaly_score (0-1, higher = more suspicious).
For each invoice provide specific, actionable recommendations based on Indian GST compliance rules.
Factor in the anomaly_score when setting priority — high anomaly_score means higher priority.
Return ONLY a valid JSON array. No markdown, no preamble. Each object must have:
invoice_number, vendor_name, issue_type, recommended_action, priority (high/medium/low), anomaly_score
"""

    try:
        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"Here are the mismatched GST invoices with anomaly scores:\n{mismatches_context}",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                max_output_tokens=2048,
                temperature=0.2,
            ),
        )
        raw = (response.text or "[]").strip()
        recommendations = json.loads(raw)
    except json.JSONDecodeError:
        recommendations = []
        logger.warning("Gemini returned non-JSON for reconcile-ai")
    except Exception as e:
        err = str(e)
        logger.error(f"Gemini reconcile-ai error: {err}")
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Gemini call failed: {err}")

    return {"recommendations": recommendations, "total_mismatches": len(mismatches)}


@router.post("/notices/{notice_id}/summarize")
async def summarize_notice(notice_id: str):
    """Fetch a GST notice by ID, summarize via Gemini, save summary back."""
    try:
        resp = supabase.table("gst_notices").select("*").eq("id", notice_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {e}")

    if not resp.data:
        raise HTTPException(status_code=404, detail="Notice not found")

    notice = resp.data[0]

    notice_text = (
        f"Notice Type: {notice.get('notice_type', 'N/A')}\n"
        f"Issued Date: {notice.get('issued_date', 'N/A')}\n"
        f"Due Date: {notice.get('due_date', 'N/A')}\n"
        f"Description: {notice.get('description', 'N/A')}\n"
        f"Status: {notice.get('status', 'N/A')}"
    )

    prompt = (
        f"Summarize the following Indian GST notice in plain English (2-3 sentences). "
        f"Then list the exact steps required to respond and resolve it under GST law.\n\n"
        f"{notice_text}"
    )

    try:
        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=512,
                temperature=0.2,
            ),
        )
        summary = (response.text or "").strip()
    except Exception as e:
        err = str(e)
        logger.error(f"Gemini notice summarize error: {err}")
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Gemini call failed: {err}")

    try:
        update_resp = (
            supabase.table("gst_notices")
            .update({"gemini_summary": summary})
            .eq("id", notice_id)
            .execute()
        )
        updated_notice = update_resp.data[0] if update_resp.data else {**notice, "gemini_summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save summary: {e}")

    return {"notice": updated_notice}
