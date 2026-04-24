"""
Aether Ecosystem Backend — Unified FastAPI Application

All modules: CRM, Documents, Tax, Supply, Interconnect
Single entry point: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AetherEcosystem")

# ─── Environment Validation ──────────────────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

_missing = []
if not SUPABASE_URL:
    _missing.append("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)")
if not SUPABASE_KEY:
    _missing.append("SUPABASE_SERVICE_ROLE_KEY")
if not GEMINI_API_KEY:
    _missing.append("GEMINI_API_KEY")

if _missing:
    print(f"\n[FATAL] Missing required .env variables: {', '.join(_missing)}")
    print("Please set them in your .env file and restart.\n")
    sys.exit(1)

# ─── ML Model Loading ────────────────────────────────────────────────────────


def _ensure_ml_models():
    """Load or train all ML models before the server accepts requests."""
    import joblib

    # AetherTax Isolation Forest
    tax_model_path = "ml/artifacts/aethertax_anomaly.pkl"
    if not os.path.exists(tax_model_path):
        logger.info("AetherTax anomaly model not found — training...")
        from ml.train_model import train_isolation_forest
        train_isolation_forest()
    else:
        logger.info("AetherTax anomaly model loaded")

    # Aether Supply XGBoost demand forecast
    supply_model_path = "ml/artifacts/aethersupply_forecast.pkl"
    if not os.path.exists(supply_model_path):
        logger.info("Aether Supply demand model not found — training...")
        from ml.train_demand import train_model
        train_model()
    else:
        logger.info("Aether Supply demand model loaded")


# ─── Lifespan ────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    print("\n" + "=" * 60)
    print("  Aether Ecosystem Backend — All modules running on port 8000")
    print("=" * 60)

    _ensure_ml_models()

    # Create Supabase tables if they don't exist
    _ensure_tables()

    print("\n  Aether Ecosystem Backend running on port 8000")
    print("  CRM ✓  Documents ✓  Tax ✓  Supply ✓  Interconnect ✓")
    print("=" * 60 + "\n")

    yield

    print("Aether Ecosystem Backend shutting down")


def _ensure_tables():
    """Create or extend the supply schema if a SQL path is available."""
    from supabase import create_client
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    ddl_statements = [
        """
        CREATE TABLE IF NOT EXISTS warehouses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            capacity INT DEFAULT 1000,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'demo-user',
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS stock_transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
            to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
            quantity INT NOT NULL,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS activity_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_name TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS supply_forecasts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES products(id),
            days_ahead INT NOT NULL,
            predictions JSONB,
            total_predicted NUMERIC,
            confidence TEXT,
            recommended_reorder NUMERIC,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS inventory_movements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES products(id),
            movement_type TEXT NOT NULL,
            quantity INT NOT NULL,
            previous_stock INT,
            new_stock INT,
            note TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'cost_price'
            ) THEN
                ALTER TABLE products ADD COLUMN cost_price NUMERIC DEFAULT 0;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'barcode'
            ) THEN
                ALTER TABLE products ADD COLUMN barcode TEXT;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'supplier_id'
            ) THEN
                ALTER TABLE products ADD COLUMN supplier_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'warehouse_id'
            ) THEN
                ALTER TABLE products ADD COLUMN warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'image_url'
            ) THEN
                ALTER TABLE products ADD COLUMN image_url TEXT;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'backup_supplier_ids'
            ) THEN
                ALTER TABLE products ADD COLUMN backup_supplier_ids JSONB DEFAULT '[]'::jsonb;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'contact_email'
            ) THEN
                ALTER TABLE vendors ADD COLUMN contact_email TEXT;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'lead_time_days'
            ) THEN
                ALTER TABLE vendors ADD COLUMN lead_time_days INT DEFAULT 7;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'rating'
            ) THEN
                ALTER TABLE vendors ADD COLUMN rating NUMERIC DEFAULT 0;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'on_time_percent'
            ) THEN
                ALTER TABLE vendors ADD COLUMN on_time_percent NUMERIC DEFAULT 0;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'total_orders'
            ) THEN
                ALTER TABLE vendors ADD COLUMN total_orders INT DEFAULT 0;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'fulfillment_rate'
            ) THEN
                ALTER TABLE vendors ADD COLUMN fulfillment_rate NUMERIC DEFAULT 0;
            END IF;
        END $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'vendors' AND column_name = 'location'
            ) THEN
                ALTER TABLE vendors ADD COLUMN location TEXT;
            END IF;
        END $$;
        """,
        """
        UPDATE vendors
        SET contact_email = COALESCE(contact_email, email)
        WHERE contact_email IS NULL;
        """,
    ]

    sql_applied = False

    if DATABASE_URL:
        try:
            import psycopg2

            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor() as cur:
                    for sql in ddl_statements:
                        cur.execute(sql)
                conn.commit()
            sql_applied = True
            logger.info("Supply schema ensured via direct Postgres connection")
        except Exception as exc:
            logger.warning(f"Direct schema ensure failed, falling back to exec_sql RPC: {exc}")

    if not sql_applied:
        for sql in ddl_statements:
            try:
                sb.rpc("exec_sql", {"query": sql}).execute()
                sql_applied = True
            except Exception:
                continue

    if not sql_applied:
        logger.warning("Supply schema could not be auto-created. Apply the SQL migrations manually if tables are missing.")

    logger.info("Supply tables check complete")


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Aether Ecosystem Backend",
    description="Unified backend for CRM, Documents, Tax, Supply, and Interconnect modules",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Import and Mount Routers ────────────────────────────────────────────────

from routes.tax import router as tax_router
from routes.documents import router as documents_router
from routes.supply import router as supply_router
from routes.interconnect import router as interconnect_router
from routes.agents import router as agents_router

app.include_router(tax_router)
app.include_router(documents_router)
app.include_router(supply_router)
app.include_router(interconnect_router)
app.include_router(agents_router)


# ─── Root Endpoint ───────────────────────────────────────────────────────────


@app.get("/")
async def root():
    """List all available module routes."""
    return {
        "service": "Aether Ecosystem Backend",
        "version": "2.0.0",
        "modules": {
            "tax": {
                "prefix": "/api/tax",
                "endpoints": [
                    "GET  /api/tax/health",
                    "POST /api/tax/sync",
                    "GET  /api/tax/overview",
                    "GET  /api/tax/reconciliation",
                    "GET  /api/tax/notices",
                    "POST /api/tax/reconcile-ai",
                    "POST /api/tax/notices/{notice_id}/summarize",
                ],
            },
            "documents": {
                "prefix": "/api/documents",
                "endpoints": [
                    "POST   /api/documents/upload",
                    "POST   /api/documents/process/{document_id}",
                    "GET    /api/documents",
                    "GET    /api/documents/{document_id}/signed-url",
                    "DELETE /api/documents/{document_id}",
                    "POST   /api/chat/documents",
                    "POST   /api/invoice/draft",
                ],
            },
            "supply": {
                "prefix": "/api/supply",
                "endpoints": [
                    "POST /api/supply/products",
                    "GET  /api/supply/products",
                    "PUT  /api/supply/products/{product_id}",
                    "DELETE /api/supply/products/{product_id}",
                    "PUT  /api/supply/products/{product_id}/stock",
                    "GET  /api/supply/sales",
                    "POST /api/supply/sales",
                    "GET  /api/supply/stock-alerts",
                    "POST /api/supply/forecast",
                    "GET  /api/supply/forecast/{product_id}",
                    "GET  /api/supply/vendors",
                    "POST /api/supply/vendors",
                    "PUT  /api/supply/vendors/{vendor_id}",
                    "DELETE /api/supply/vendors/{vendor_id}",
                    "GET  /api/supply/warehouses",
                    "POST /api/supply/warehouses",
                    "PUT  /api/supply/warehouses/{warehouse_id}",
                    "DELETE /api/supply/warehouses/{warehouse_id}",
                    "GET  /api/supply/categories",
                    "POST /api/supply/categories",
                    "PUT  /api/supply/categories/{category_name}",
                    "DELETE /api/supply/categories/{category_name}",
                    "GET  /api/supply/stock-transfers",
                    "POST /api/supply/stock-transfers",
                    "GET  /api/supply/activity-log",
                    "POST /api/supply/activity-log",
                    "GET  /api/supply/ai-intelligence",
                    "GET  /api/supply/category-insights",
                    "GET  /api/supply/profit-margins",
                ],
            },
            "interconnect": {
                "prefix": "/api/interconnect",
                "endpoints": [
                    "POST /api/interconnect/document-processed",
                    "POST /api/interconnect/tax-anomaly",
                    "POST /api/interconnect/stock-low",
                    "POST /api/interconnect/whatsapp-order",
                    "POST /api/interconnect/sdr-action",
                    "GET  /api/interconnect/client-profile/{client_id}",
                    "GET  /api/interconnect/health",
                ],
            },
            "agents": {
                "prefix": "/api/agents",
                "endpoints": [
                    "POST /api/agents/sync/supply-to-crm",
                    "GET  /api/agents/sdr/context",
                    "POST /api/agents/sdr/insight",
                    "POST /api/agents/sdr/score",
                    "POST /api/agents/sdr/draft-email",
                    "GET  /api/agents/commerce/context",
                    "POST /api/agents/commerce/brief",
                    "POST /api/agents/commerce/reply-suggestion",
                    "POST /api/agents/commerce/broadcast",
                    "POST /api/agents/commerce/translate",
                ],
            },
        },
    }


@app.get("/health")
async def health():
    """Global health check."""
    return {
        "status": "ok",
        "service": "Aether Ecosystem Backend",
        "modules": ["CRM", "Documents", "Tax", "Supply", "Interconnect"],
    }
