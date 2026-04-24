-- =============================================================================
-- Aether Supply - Supabase schema additions
-- Run this in the Supabase SQL Editor after interconnect_schema.sql
-- =============================================================================

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INT DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories used by the supply frontend
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'demo-user',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock transfer history
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log used by the frontend audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ML forecast cache
CREATE TABLE IF NOT EXISTS supply_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    days_ahead INT NOT NULL,
    predictions JSONB,
    total_predicted NUMERIC,
    confidence TEXT,
    recommended_reorder NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory movement history
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','transfer','adjustment')),
    quantity INT NOT NULL,
    previous_stock INT,
    new_stock INT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Extend products to match the supply frontend contract
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS barcode TEXT,
    ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS backup_supplier_ids JSONB DEFAULT '[]'::jsonb;

-- Extend vendors to match the supply frontend contract
ALTER TABLE vendors
    ADD COLUMN IF NOT EXISTS contact_email TEXT,
    ADD COLUMN IF NOT EXISTS lead_time_days INT DEFAULT 7,
    ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS on_time_percent NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fulfillment_rate NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS location TEXT;

UPDATE vendors
SET contact_email = COALESCE(contact_email, email)
WHERE contact_email IS NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id_created_at ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_forecasts_product_id_created_at ON supply_forecasts(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_product_id_created_at ON orders(product_id, created_at DESC);
