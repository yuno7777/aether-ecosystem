-- =============================================================================
-- Aether Ecosystem — Unified Supabase Schema
-- Run once in the Supabase SQL Editor. All statements are idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Shared Master Tables
-- ---------------------------------------------------------------------------

-- AetherCRM — master client record referenced by all modules
CREATE TABLE IF NOT EXISTS clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    gstin           TEXT,
    company         TEXT,
    status          TEXT DEFAULT 'lead'
                    CHECK (status IN ('lead','contacted','proposal','won','lost')),
    health          TEXT DEFAULT 'good'
                    CHECK (health IN ('good','at_risk','critical')),
    compliance_alert BOOLEAN DEFAULT false,
    source          TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Aether Supply — vendor master, referenced by AetherTax and AetherDocs
CREATE TABLE IF NOT EXISTS vendors (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    gstin            TEXT,
    email            TEXT,
    phone            TEXT,
    is_gst_compliant BOOLEAN DEFAULT true,
    compliance_risk  TEXT DEFAULT 'low'
                     CHECK (compliance_risk IN ('low','medium','high')),
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- Aether Supply — product/inventory master, referenced by AetherCommerce
CREATE TABLE IF NOT EXISTS products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    sku               TEXT UNIQUE NOT NULL,
    category          TEXT,
    price             NUMERIC DEFAULT 0,
    stock_quantity    INTEGER DEFAULT 0,
    reorder_threshold INTEGER DEFAULT 10,
    is_out_of_stock   BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- AetherDocs — extracted invoices, consumed by AetherTax and Aether Supply
CREATE TABLE IF NOT EXISTS invoices (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id      UUID REFERENCES documents(id) ON DELETE SET NULL,
    client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
    vendor_id        UUID REFERENCES vendors(id) ON DELETE SET NULL,
    invoice_number   TEXT,
    invoice_date     DATE,
    due_date         DATE,
    total_amount     NUMERIC DEFAULT 0,
    tax_amount       NUMERIC DEFAULT 0,
    gstin            TEXT,
    line_items       JSONB,
    pushed_to_tax    BOOLEAN DEFAULT false,
    pushed_to_supply BOOLEAN DEFAULT false,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- AetherCommerce — customer orders, referenced by Supply and CRM
CREATE TABLE IF NOT EXISTS orders (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
    product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity     INTEGER DEFAULT 1,
    total_amount NUMERIC DEFAULT 0,
    status       TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
    channel      TEXT DEFAULT 'whatsapp',
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- AetherCRM / AetherSDR — leads pipeline, consumed by AetherSDR
CREATE TABLE IF NOT EXISTS leads (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id          UUID REFERENCES clients(id) ON DELETE SET NULL,
    name               TEXT NOT NULL,
    email              TEXT,
    phone              TEXT,
    company            TEXT,
    status             TEXT DEFAULT 'new'
                       CHECK (status IN ('new','contacted','replied','meeting_booked','won','lost')),
    sdr_last_action    TEXT,
    sdr_last_action_at TIMESTAMPTZ,
    sdr_attempt_count  INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PART 7: Aether Event Log — audit trail for all cross-module actions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS aether_event_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type    TEXT NOT NULL,
    source_module TEXT NOT NULL,
    target_module TEXT NOT NULL,
    payload       JSONB,
    status        TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','success','failed')),
    error_message TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PART 2: Database Triggers
-- ---------------------------------------------------------------------------

-- Trigger 1: New invoice with pushed_to_tax=false → push to gst_invoices
CREATE OR REPLACE FUNCTION fn_invoice_push_to_tax()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pushed_to_tax = false AND NEW.invoice_number IS NOT NULL THEN
        INSERT INTO gst_invoices (
            invoice_number,
            vendor_name,
            gstin,
            value_books,
            invoice_date,
            status,
            source
        )
        SELECT
            NEW.invoice_number,
            COALESCE(v.name, 'Unknown'),
            COALESCE(NEW.gstin, ''),
            COALESCE(NEW.total_amount, 0),
            NEW.invoice_date,
            'pending',
            'aetherdocs'
        FROM (SELECT 1) AS _dummy
        LEFT JOIN vendors v ON v.id = NEW.vendor_id
        ON CONFLICT (invoice_number, gstin) DO NOTHING;

        UPDATE invoices SET pushed_to_tax = true WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_push_to_tax ON invoices;
CREATE TRIGGER trg_invoice_push_to_tax
    AFTER INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION fn_invoice_push_to_tax();

-- Trigger 2: New order → decrement product stock, set is_out_of_stock if zero
CREATE OR REPLACE FUNCTION fn_order_decrement_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET
        stock_quantity  = GREATEST(0, stock_quantity - NEW.quantity),
        is_out_of_stock = (stock_quantity - NEW.quantity) <= 0,
        updated_at      = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_decrement_stock ON orders;
CREATE TRIGGER trg_order_decrement_stock
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_order_decrement_stock();

-- Trigger 3: GST invoice flagged (is_flagged=true, status=missing_2b)
--            → set vendor compliance_risk=high, is_gst_compliant=false
CREATE OR REPLACE FUNCTION fn_gst_flag_vendor()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_flagged = true AND NEW.status = 'missing_2b' AND NEW.gstin IS NOT NULL THEN
        UPDATE vendors
        SET compliance_risk  = 'high',
            is_gst_compliant = false
        WHERE gstin = NEW.gstin;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gst_flag_vendor ON gst_invoices;
CREATE TRIGGER trg_gst_flag_vendor
    AFTER INSERT OR UPDATE ON gst_invoices
    FOR EACH ROW EXECUTE FUNCTION fn_gst_flag_vendor();

-- Trigger 4: Lead status → meeting_booked → update client status to proposal
CREATE OR REPLACE FUNCTION fn_lead_meeting_to_proposal()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'meeting_booked'
       AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'meeting_booked')
       AND NEW.client_id IS NOT NULL
    THEN
        UPDATE clients
        SET status     = 'proposal',
            updated_at = now()
        WHERE id = NEW.client_id
          AND status NOT IN ('won', 'lost');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_meeting_to_proposal ON leads;
CREATE TRIGGER trg_lead_meeting_to_proposal
    AFTER INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION fn_lead_meeting_to_proposal();

-- Trigger 5: Client status → won → update all linked leads to won + sdr_last_action=deal_closed
CREATE OR REPLACE FUNCTION fn_client_won_close_leads()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'won' AND OLD.status IS DISTINCT FROM 'won' THEN
        UPDATE leads
        SET status             = 'won',
            sdr_last_action    = 'deal_closed',
            sdr_last_action_at = now()
        WHERE client_id = NEW.id
          AND status NOT IN ('won', 'lost');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_won_close_leads ON clients;
CREATE TRIGGER trg_client_won_close_leads
    AFTER UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION fn_client_won_close_leads();

-- Trigger 6: New order → touch client updated_at
CREATE OR REPLACE FUNCTION fn_order_touch_client()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        UPDATE clients
        SET updated_at = now()
        WHERE id = NEW.client_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_touch_client ON orders;
CREATE TRIGGER trg_order_touch_client
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_order_touch_client();
