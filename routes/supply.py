"""
Aether Supply routes backed by Supabase.
Mounted under /api/supply
"""
import logging
import os
from datetime import datetime
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, create_client

from ml.demand_scorer import forecast_demand, load_or_train_demand

load_dotenv()

logger = logging.getLogger("AetherSupply")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

_demand_model, _demand_features = load_or_train_demand()

router = APIRouter(prefix="/api/supply", tags=["supply"])


class CreateProductRequest(BaseModel):
    name: str
    sku: str
    category: str
    price: float
    stock_quantity: int = 0
    reorder_threshold: int = 10
    cost_price: Optional[float] = None
    barcode: Optional[str] = None
    supplier_id: Optional[str] = None
    backup_supplier_ids: list[str] = Field(default_factory=list)
    warehouse_id: Optional[str] = None
    image_url: Optional[str] = None


class UpdateProductRequest(CreateProductRequest):
    pass


class UpdateStockRequest(BaseModel):
    quantity: int
    note: Optional[str] = None


class ForecastRequest(BaseModel):
    product_id: str
    days_ahead: int = 30
    historical_sales: Optional[list[dict[str, Any]]] = None
    current_stock: Optional[int] = 0


class CreateVendorRequest(BaseModel):
    name: str
    gstin: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    compliance_risk: Optional[str] = "low"
    is_gst_compliant: Optional[bool] = True
    lead_time_days: int = 7
    rating: Optional[float] = 0
    on_time_percent: Optional[float] = 0
    total_orders: Optional[int] = 0
    fulfillment_rate: Optional[float] = 0
    location: Optional[str] = None


class UpdateVendorRequest(CreateVendorRequest):
    pass


class CreateWarehouseRequest(BaseModel):
    name: str
    location: str
    capacity: int = 1000


class UpdateWarehouseRequest(CreateWarehouseRequest):
    pass


class CreateCategoryRequest(BaseModel):
    name: str
    user_id: str = "demo-user"


class UpdateCategoryRequest(BaseModel):
    name: str
    user_id: str = "demo-user"


class CreateSaleRequest(BaseModel):
    product_id: str
    quantity: int


class CreateStockTransferRequest(BaseModel):
    product_id: str
    from_warehouse_id: str
    to_warehouse_id: str
    quantity: int
    notes: Optional[str] = None


class CreateActivityLogRequest(BaseModel):
    user_id: str
    action: str
    entity_type: str
    entity_name: str
    details: Optional[str] = None


def _parse_numeric(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _vendor_to_supplier(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row.get("name") or "",
        "contactEmail": row.get("contact_email") or row.get("email") or "",
        "leadTimeDays": _parse_int(row.get("lead_time_days"), 7),
        "location": row.get("location") or "",
        "rating": _parse_numeric(row.get("rating")),
        "onTimePercent": _parse_numeric(row.get("on_time_percent")),
        "totalOrders": _parse_int(row.get("total_orders")),
        "fulfillmentRate": _parse_numeric(row.get("fulfillment_rate")),
    }


def _product_to_frontend(row: dict[str, Any]) -> dict[str, Any]:
    primary_supplier_id = row.get("supplier_id")
    backup_supplier_ids = row.get("backup_supplier_ids") or []
    supplier_ids = []
    if primary_supplier_id:
        supplier_ids.append(primary_supplier_id)
    for supplier_id in backup_supplier_ids:
        if supplier_id and supplier_id not in supplier_ids:
            supplier_ids.append(supplier_id)

    return {
        "id": row["id"],
        "name": row.get("name") or "",
        "sku": row.get("sku") or "",
        "barcode": row.get("barcode"),
        "category": row.get("category") or "",
        "price": _parse_numeric(row.get("price")),
        "cost": _parse_numeric(row.get("cost_price")),
        "stock": _parse_int(row.get("stock_quantity")),
        "reorderLevel": _parse_int(row.get("reorder_threshold"), 10),
        "supplierId": primary_supplier_id or "",
        "supplierIds": supplier_ids,
        "warehouseId": row.get("warehouse_id"),
        "imageUrl": row.get("image_url"),
    }


def _sale_to_frontend(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "productId": row.get("product_id"),
        "quantity": _parse_int(row.get("quantity"), 1),
        "date": row.get("created_at") or datetime.utcnow().isoformat(),
    }


def _warehouse_to_frontend(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row.get("name") or "",
        "location": row.get("location") or "",
        "capacity": _parse_int(row.get("capacity"), 1000),
    }


def _stock_transfer_to_frontend(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "productId": row.get("product_id"),
        "fromWarehouseId": row.get("from_warehouse_id"),
        "toWarehouseId": row.get("to_warehouse_id"),
        "quantity": _parse_int(row.get("quantity")),
        "notes": row.get("notes"),
        "createdAt": row.get("created_at") or datetime.utcnow().isoformat(),
    }


def _activity_log_to_frontend(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "action": row.get("action"),
        "entity_type": row.get("entity_type"),
        "entity_name": row.get("entity_name"),
        "details": row.get("details"),
        "created_at": row.get("created_at") or datetime.utcnow().isoformat(),
    }


async def _trigger_stock_low(product_id: str, current_stock: int):
    from aether_interconnect import on_stock_low

    try:
        await on_stock_low(product_id, current_stock)
    except Exception as exc:
        logger.warning(f"Interconnect stock-low notify failed for {product_id}: {exc}")


def _get_product(product_id: str) -> Optional[dict[str, Any]]:
    try:
        resp = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        if resp.data:
            return resp.data[0]
        return None
    except Exception:
        return None


def _get_historical_sales(product_id: str) -> list[dict[str, Any]]:
    try:
        movement_resp = (
            supabase.table("inventory_movements")
            .select("created_at, quantity")
            .eq("product_id", product_id)
            .eq("movement_type", "out")
            .order("created_at", desc=False)
            .execute()
        )
        if movement_resp.data and len(movement_resp.data) > 5:
            return [
                {"date": row["created_at"][:10], "quantity": abs(_parse_int(row["quantity"]))}
                for row in movement_resp.data
            ]

        order_resp = (
            supabase.table("orders")
            .select("created_at, quantity")
            .eq("product_id", product_id)
            .order("created_at", desc=False)
            .execute()
        )
        if order_resp.data:
            return [
                {"date": row["created_at"][:10], "quantity": _parse_int(row["quantity"])}
                for row in order_resp.data
            ]

        return []
    except Exception as exc:
        logger.warning(f"Failed to fetch historical sales for {product_id}: {exc}")
        return []


def _insert_inventory_movement(
    product_id: str,
    movement_type: str,
    quantity: int,
    previous_stock: Optional[int],
    new_stock: Optional[int],
    note: Optional[str] = None,
):
    try:
        supabase.table("inventory_movements").insert(
            {
                "product_id": product_id,
                "movement_type": movement_type,
                "quantity": abs(quantity),
                "previous_stock": previous_stock,
                "new_stock": new_stock,
                "note": note,
            }
        ).execute()
    except Exception as exc:
        logger.warning(f"Failed to insert inventory movement for {product_id}: {exc}")


@router.get("/products")
async def list_products():
    try:
        resp = supabase.table("products").select("*").order("created_at", desc=True).execute()
        products = [_product_to_frontend(row) for row in (resp.data or [])]
        return {"products": products}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {exc}")


@router.post("/products")
async def create_product(req: CreateProductRequest):
    payload = {
        "name": req.name,
        "sku": req.sku,
        "category": req.category,
        "price": req.price,
        "stock_quantity": req.stock_quantity,
        "reorder_threshold": req.reorder_threshold,
        "cost_price": req.cost_price or 0,
        "barcode": req.barcode,
        "supplier_id": req.supplier_id,
        "backup_supplier_ids": req.backup_supplier_ids,
        "warehouse_id": req.warehouse_id,
        "image_url": req.image_url,
        "is_out_of_stock": req.stock_quantity <= 0,
    }

    try:
        resp = supabase.table("products").insert(payload).execute()
        product = resp.data[0]
        _insert_inventory_movement(
            product_id=product["id"],
            movement_type="in" if req.stock_quantity > 0 else "adjustment",
            quantity=req.stock_quantity,
            previous_stock=0,
            new_stock=req.stock_quantity,
            note="Initial product stock",
        )
        return {"product": _product_to_frontend(product)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create product: {exc}")


@router.put("/products/{product_id}")
async def update_product(product_id: str, req: UpdateProductRequest):
    existing = _get_product(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    payload = {
        "name": req.name,
        "sku": req.sku,
        "category": req.category,
        "price": req.price,
        "stock_quantity": req.stock_quantity,
        "reorder_threshold": req.reorder_threshold,
        "cost_price": req.cost_price or 0,
        "barcode": req.barcode,
        "supplier_id": req.supplier_id,
        "backup_supplier_ids": req.backup_supplier_ids,
        "warehouse_id": req.warehouse_id,
        "image_url": req.image_url,
        "is_out_of_stock": req.stock_quantity <= 0,
        "updated_at": datetime.utcnow().isoformat(),
    }

    try:
        resp = supabase.table("products").update(payload).eq("id", product_id).execute()
        updated = resp.data[0] if resp.data else _get_product(product_id)
        previous_stock = _parse_int(existing.get("stock_quantity"))
        new_stock = req.stock_quantity
        if previous_stock != new_stock:
            movement_type = "in" if new_stock > previous_stock else "out"
            _insert_inventory_movement(
                product_id=product_id,
                movement_type=movement_type,
                quantity=abs(new_stock - previous_stock),
                previous_stock=previous_stock,
                new_stock=new_stock,
                note="Product updated from frontend",
            )
        return {"product": _product_to_frontend(updated)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update product: {exc}")


@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    try:
        supabase.table("products").delete().eq("id", product_id).execute()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {exc}")


@router.put("/products/{product_id}/stock")
async def update_stock(product_id: str, req: UpdateStockRequest, background_tasks: BackgroundTasks):
    product = _get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    previous_stock = _parse_int(product.get("stock_quantity"))
    new_stock = req.quantity
    reorder_threshold = _parse_int(product.get("reorder_threshold"), 10)

    try:
        supabase.table("products").update(
            {
                "stock_quantity": new_stock,
                "is_out_of_stock": new_stock <= 0,
                "updated_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", product_id).execute()

        movement_type = "in" if new_stock > previous_stock else "out"
        if new_stock == previous_stock:
            movement_type = "adjustment"
        _insert_inventory_movement(
            product_id=product_id,
            movement_type=movement_type,
            quantity=abs(new_stock - previous_stock),
            previous_stock=previous_stock,
            new_stock=new_stock,
            note=req.note or f"Stock updated from {previous_stock} to {new_stock}",
        )

        if new_stock < reorder_threshold:
            background_tasks.add_task(_trigger_stock_low, product_id, new_stock)

        return {
            "product_id": product_id,
            "previous_stock": previous_stock,
            "new_stock": new_stock,
            "below_threshold": new_stock < reorder_threshold,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update stock: {exc}")


@router.get("/sales")
async def list_sales():
    try:
        resp = (
            supabase.table("orders")
            .select("id, product_id, quantity, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        sales = [_sale_to_frontend(row) for row in (resp.data or []) if row.get("product_id")]
        return {"sales": sales}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sales: {exc}")


@router.post("/sales")
async def create_sale(req: CreateSaleRequest):
    product = _get_product(req.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    previous_stock = _parse_int(product.get("stock_quantity"))
    total_amount = _parse_numeric(product.get("price")) * req.quantity

    try:
        resp = supabase.table("orders").insert(
            {
                "product_id": req.product_id,
                "quantity": req.quantity,
                "total_amount": total_amount,
                "status": "delivered",
                "channel": "manual",
            }
        ).execute()

        refreshed = _get_product(req.product_id) or {**product, "stock_quantity": max(0, previous_stock - req.quantity)}
        new_stock = _parse_int(refreshed.get("stock_quantity"), max(0, previous_stock - req.quantity))
        _insert_inventory_movement(
            product_id=req.product_id,
            movement_type="out",
            quantity=req.quantity,
            previous_stock=previous_stock,
            new_stock=new_stock,
            note="Manual sale recorded",
        )

        sale = resp.data[0]
        return {"sale": _sale_to_frontend(sale), "product": _product_to_frontend(refreshed)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create sale: {exc}")


@router.get("/vendors")
async def list_vendors():
    try:
        resp = supabase.table("vendors").select("*").order("name", desc=False).execute()
        return {"vendors": [_vendor_to_supplier(row) for row in (resp.data or [])]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vendors: {exc}")


@router.post("/vendors")
async def create_vendor(req: CreateVendorRequest):
    payload = {
        "name": req.name,
        "gstin": req.gstin,
        "email": req.contact_email,
        "contact_email": req.contact_email,
        "phone": req.phone,
        "compliance_risk": req.compliance_risk,
        "is_gst_compliant": req.is_gst_compliant,
        "lead_time_days": req.lead_time_days,
        "rating": req.rating or 0,
        "on_time_percent": req.on_time_percent or 0,
        "total_orders": req.total_orders or 0,
        "fulfillment_rate": req.fulfillment_rate or 0,
        "location": req.location,
    }
    try:
        resp = supabase.table("vendors").insert(payload).execute()
        return {"vendor": _vendor_to_supplier(resp.data[0])}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create vendor: {exc}")


@router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, req: UpdateVendorRequest):
    payload = {
        "name": req.name,
        "gstin": req.gstin,
        "email": req.contact_email,
        "contact_email": req.contact_email,
        "phone": req.phone,
        "compliance_risk": req.compliance_risk,
        "is_gst_compliant": req.is_gst_compliant,
        "lead_time_days": req.lead_time_days,
        "rating": req.rating or 0,
        "on_time_percent": req.on_time_percent or 0,
        "total_orders": req.total_orders or 0,
        "fulfillment_rate": req.fulfillment_rate or 0,
        "location": req.location,
    }
    try:
        resp = supabase.table("vendors").update(payload).eq("id", vendor_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Vendor not found")
        return {"vendor": _vendor_to_supplier(resp.data[0])}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update vendor: {exc}")


@router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str):
    try:
        supabase.table("vendors").delete().eq("id", vendor_id).execute()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete vendor: {exc}")


@router.get("/warehouses")
async def list_warehouses():
    try:
        resp = supabase.table("warehouses").select("*").order("name", desc=False).execute()
        return {"warehouses": [_warehouse_to_frontend(row) for row in (resp.data or [])]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch warehouses: {exc}")


@router.post("/warehouses")
async def create_warehouse(req: CreateWarehouseRequest):
    try:
        resp = supabase.table("warehouses").insert(req.model_dump()).execute()
        return {"warehouse": _warehouse_to_frontend(resp.data[0])}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create warehouse: {exc}")


@router.put("/warehouses/{warehouse_id}")
async def update_warehouse(warehouse_id: str, req: UpdateWarehouseRequest):
    try:
        resp = supabase.table("warehouses").update(req.model_dump()).eq("id", warehouse_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Warehouse not found")
        return {"warehouse": _warehouse_to_frontend(resp.data[0])}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update warehouse: {exc}")


@router.delete("/warehouses/{warehouse_id}")
async def delete_warehouse(warehouse_id: str):
    try:
        supabase.table("warehouses").delete().eq("id", warehouse_id).execute()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete warehouse: {exc}")


@router.get("/categories")
async def list_categories():
    try:
        resp = supabase.table("categories").select("*").order("name", desc=False).execute()
        return {"categories": resp.data or []}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {exc}")


@router.post("/categories")
async def create_category(req: CreateCategoryRequest):
    try:
        resp = supabase.table("categories").insert(req.model_dump()).execute()
        return {"category": resp.data[0]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {exc}")


@router.put("/categories/{category_name}")
async def update_category(category_name: str, req: UpdateCategoryRequest):
    try:
        resp = (
            supabase.table("categories")
            .update({"name": req.name, "user_id": req.user_id})
            .eq("name", category_name)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Category not found")

        supabase.table("products").update({"category": req.name}).eq("category", category_name).execute()
        return {"category": resp.data[0]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update category: {exc}")


@router.delete("/categories/{category_name}")
async def delete_category(category_name: str):
    try:
        supabase.table("categories").delete().eq("name", category_name).execute()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {exc}")


@router.get("/stock-transfers")
async def list_stock_transfers():
    try:
        resp = supabase.table("stock_transfers").select("*").order("created_at", desc=True).execute()
        return {"transfers": [_stock_transfer_to_frontend(row) for row in (resp.data or [])]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock transfers: {exc}")


@router.post("/stock-transfers")
async def create_stock_transfer(req: CreateStockTransferRequest):
    try:
        resp = supabase.table("stock_transfers").insert(req.model_dump()).execute()
        _insert_inventory_movement(
            product_id=req.product_id,
            movement_type="transfer",
            quantity=req.quantity,
            previous_stock=None,
            new_stock=None,
            note=req.notes or f"Transfer from {req.from_warehouse_id} to {req.to_warehouse_id}",
        )
        return {"transfer": _stock_transfer_to_frontend(resp.data[0])}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create stock transfer: {exc}")


@router.get("/activity-log")
async def list_activity_log(user_id: Optional[str] = None, limit: int = 100):
    try:
        query = supabase.table("activity_logs").select("*").order("created_at", desc=True).limit(limit)
        if user_id:
            query = query.eq("user_id", user_id)
        resp = query.execute()
        return {"entries": [_activity_log_to_frontend(row) for row in (resp.data or [])]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity log: {exc}")


@router.post("/activity-log")
async def create_activity_log(req: CreateActivityLogRequest):
    try:
        resp = supabase.table("activity_logs").insert(req.model_dump()).execute()
        return {"entry": _activity_log_to_frontend(resp.data[0])}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create activity log: {exc}")


@router.get("/stock-alerts")
async def stock_alerts():
    try:
        resp = supabase.table("products").select("*").execute()
        products = resp.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {exc}")

    alerts = []
    for product in products:
        stock = _parse_int(product.get("stock_quantity"))
        threshold = _parse_int(product.get("reorder_threshold"), 10)
        if stock < threshold:
            historical = _get_historical_sales(product["id"])
            predicted_demand_30d = 0
            days_of_stock = 999.0

            if historical:
                forecast = forecast_demand(product["id"], historical, days_ahead=30)
                predicted_demand_30d = forecast["total_predicted"]
                daily_avg = predicted_demand_30d / 30 if predicted_demand_30d > 0 else 0
                days_of_stock = round(stock / daily_avg, 1) if daily_avg > 0 else 999.0

            alerts.append(
                {
                    "product_id": product["id"],
                    "name": product.get("name"),
                    "sku": product.get("sku"),
                    "current_stock": stock,
                    "reorder_threshold": threshold,
                    "predicted_demand_30d": predicted_demand_30d,
                    "days_of_stock_remaining": days_of_stock,
                    "urgency": "critical" if days_of_stock < 7 else ("high" if days_of_stock < 14 else "medium"),
                }
            )

    alerts.sort(key=lambda item: item["days_of_stock_remaining"])
    return {"alerts": alerts, "total": len(alerts)}


@router.post("/forecast")
async def create_forecast(req: ForecastRequest):
    if req.days_ahead not in (7, 30, 90):
        raise HTTPException(status_code=400, detail="days_ahead must be 7, 30, or 90")

    product = _get_product(req.product_id)
    if not product and not req.historical_sales:
        raise HTTPException(status_code=404, detail="Product not found and no historical_sales provided")

    historical = _get_historical_sales(req.product_id) if product else []
    if not historical and req.historical_sales:
        historical = req.historical_sales

    if not historical:
        return {
            "product_id": req.product_id,
            "days_ahead": req.days_ahead,
            "daily_predictions": [],
            "total_predicted": 0,
            "confidence": "low",
            "recommended_reorder": 0,
            "message": "No historical sales data available for this product",
        }

    forecast = forecast_demand(req.product_id, historical, req.days_ahead)
    current_stock = _parse_int((product or {}).get("stock_quantity"), req.current_stock or 0)
    recommended_reorder = max(0, round(forecast["total_predicted"] - current_stock))

    try:
        if product:
            supabase.table("supply_forecasts").insert(
                {
                    "product_id": req.product_id,
                    "days_ahead": req.days_ahead,
                    "predictions": forecast["daily_predictions"],
                    "total_predicted": forecast["total_predicted"],
                    "confidence": forecast["confidence"],
                    "recommended_reorder": recommended_reorder,
                }
            ).execute()
    except Exception as exc:
        logger.warning(f"Failed to save forecast to DB: {exc}")

    return {
        "product_id": req.product_id,
        "days_ahead": req.days_ahead,
        "daily_predictions": forecast["daily_predictions"],
        "total_predicted": forecast["total_predicted"],
        "confidence": forecast["confidence"],
        "recommended_reorder": recommended_reorder,
        "current_stock": current_stock,
    }


@router.get("/forecast/{product_id}")
async def get_latest_forecast(product_id: str):
    try:
        resp = (
            supabase.table("supply_forecasts")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="No forecast found for this product")
        return {"forecast": resp.data[0]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {exc}")


@router.get("/ai-intelligence")
async def ai_intelligence():
    import hashlib

    import joblib
    import numpy as np

    anomaly_model_path = "ml/artifacts/aethertax_anomaly.pkl"
    scaler_path = "ml/artifacts/aethertax_scaler.pkl"

    if not os.path.exists(anomaly_model_path) or not os.path.exists(scaler_path):
        raise HTTPException(status_code=503, detail="Anomaly detection model not available")

    anomaly_model = joblib.load(anomaly_model_path)
    scaler = joblib.load(scaler_path)

    try:
        resp = (
            supabase.table("inventory_movements")
            .select("*")
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )
        movements = resp.data or []
    except Exception:
        movements = []

    if not movements:
        return {"anomalies": [], "total_analyzed": 0, "message": "No inventory movement data to analyze"}

    anomalies = []
    for movement in movements:
        quantity = abs(_parse_int(movement.get("quantity")))
        previous_stock = _parse_int(movement.get("previous_stock"))
        new_stock = _parse_int(movement.get("new_stock"))
        change = abs(new_stock - previous_stock)

        seed = f"{movement.get('product_id', '')}{movement.get('created_at', '')}"
        hash_val = int(hashlib.md5(seed.encode()).hexdigest(), 16)
        np.random.seed(hash_val % (2**32))
        pseudo_v = np.random.normal(0, 1, 28)
        pseudo_v[0] = change / max(previous_stock, 1) * 3
        pseudo_v[1] = np.log1p(quantity) / 10
        pseudo_v[2] = 0.8 if movement.get("movement_type") == "adjustment" else 0.0

        features = np.array([[quantity] + pseudo_v.tolist()])
        features_scaled = scaler.transform(features)

        raw_score = anomaly_model.decision_function(features_scaled)[0]
        if not np.isfinite(raw_score):
            raw_score = 0.0

        normalized = 1 - (raw_score - (-0.5)) / (0.5 - (-0.5))
        normalized = float(np.clip(normalized, 0, 1))

        if normalized > 0.6:
            anomalies.append(
                {
                    "movement_id": movement.get("id"),
                    "product_id": movement.get("product_id"),
                    "movement_type": movement.get("movement_type"),
                    "quantity": quantity,
                    "previous_stock": previous_stock,
                    "new_stock": new_stock,
                    "anomaly_score": round(normalized, 4),
                    "severity": "high" if normalized > 0.8 else "medium",
                    "created_at": movement.get("created_at"),
                    "note": movement.get("note"),
                }
            )

    anomalies.sort(key=lambda item: item["anomaly_score"], reverse=True)
    return {"anomalies": anomalies, "total_analyzed": len(movements), "total_flagged": len(anomalies)}


@router.get("/category-insights")
async def get_category_insights():
    try:
        resp = supabase.table("products").select("category, stock_quantity, price").execute()
        products = resp.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {exc}")

    categories: dict[str, dict[str, Any]] = {}
    for product in products:
        category = product.get("category") or "Uncategorized"
        if category not in categories:
            categories[category] = {
                "category": category,
                "total_stock_value": 0.0,
                "product_count": 0,
                "total_units": 0,
            }
        stock = _parse_int(product.get("stock_quantity"))
        price = _parse_numeric(product.get("price"))
        categories[category]["total_stock_value"] += stock * price
        categories[category]["product_count"] += 1
        categories[category]["total_units"] += stock

    result = sorted(categories.values(), key=lambda item: item["total_stock_value"], reverse=True)
    for row in result:
        row["total_stock_value"] = round(row["total_stock_value"], 2)
    return {"categories": result}


@router.get("/profit-margins")
async def get_profit_margins():
    try:
        resp = supabase.table("products").select("*").execute()
        products = resp.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {exc}")

    margins = []
    for product in products:
        selling = _parse_numeric(product.get("price"))
        cost = _parse_numeric(product.get("cost_price"))
        margin = selling - cost
        margin_pct = round((margin / selling * 100), 2) if selling > 0 else 0
        stock_quantity = _parse_int(product.get("stock_quantity"))

        margins.append(
            {
                "product_id": product["id"],
                "name": product.get("name"),
                "sku": product.get("sku"),
                "category": product.get("category"),
                "cost_price": cost,
                "selling_price": selling,
                "margin": round(margin, 2),
                "margin_percentage": margin_pct,
                "stock_quantity": stock_quantity,
                "total_stock_value": round(selling * stock_quantity, 2),
            }
        )

    margins.sort(key=lambda item: item["margin_percentage"], reverse=True)
    return {"margins": margins}
