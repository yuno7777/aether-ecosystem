// @ts-nocheck
import { Product, Supplier, Warehouse, Sale, StockTransfer } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_SUPPLY_API_URL || 'http://localhost:8000/api/supply';

const jsonHeaders = {
    'Content-Type': 'application/json'
};

const readJson = async (res: Response) => {
    if (!res.ok) {
        let message = `Request failed with ${res.status}`;
        try {
            const data = await res.json();
            message = data.detail || data.message || message;
        } catch {
            // ignore parse failures
        }
        throw new Error(message);
    }
    return res.json();
};

// ==================== SUPPLIERS ====================
export const fetchSuppliers = async (_userId: string): Promise<Supplier[]> => {
    const res = await fetch(`${API_BASE}/vendors`);
    const data = await readJson(res);
    return data.vendors || [];
};

export const addSupplier = async (supplier: Omit<Supplier, 'id'>, _userId: string): Promise<Supplier> => {
    const res = await fetch(`${API_BASE}/vendors`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            name: supplier.name,
            contact_email: supplier.contactEmail,
            lead_time_days: supplier.leadTimeDays,
            location: supplier.location,
            rating: supplier.rating,
            on_time_percent: supplier.onTimePercent,
            total_orders: supplier.totalOrders,
            fulfillment_rate: supplier.fulfillmentRate,
        })
    });
    const data = await readJson(res);
    return data.vendor;
};

export const updateSupplier = async (supplier: Supplier, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/vendors/${supplier.id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
            name: supplier.name,
            contact_email: supplier.contactEmail,
            lead_time_days: supplier.leadTimeDays,
            location: supplier.location,
            rating: supplier.rating,
            on_time_percent: supplier.onTimePercent,
            total_orders: supplier.totalOrders,
            fulfillment_rate: supplier.fulfillmentRate,
        })
    }));
};

export const deleteSupplier = async (id: string, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE' }));
};

// ==================== WAREHOUSES ====================
export const fetchWarehouses = async (_userId: string): Promise<Warehouse[]> => {
    const res = await fetch(`${API_BASE}/warehouses`);
    const data = await readJson(res);
    return data.warehouses || [];
};

export const addWarehouse = async (warehouse: Omit<Warehouse, 'id'>, _userId: string): Promise<Warehouse> => {
    const res = await fetch(`${API_BASE}/warehouses`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(warehouse)
    });
    const data = await readJson(res);
    return data.warehouse;
};

export const updateWarehouse = async (warehouse: Warehouse, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/warehouses/${warehouse.id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
            name: warehouse.name,
            location: warehouse.location,
            capacity: warehouse.capacity
        })
    }));
};

export const deleteWarehouse = async (id: string, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/warehouses/${id}`, { method: 'DELETE' }));
};

// ==================== CATEGORIES ====================
export const fetchCategories = async (_userId: string): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await readJson(res);
    return (data.categories || []).map((category: { name: string }) => category.name);
};

export const addCategory = async (name: string, userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ name, user_id: userId })
    }));
};

export const updateCategory = async (oldName: string, newName: string, userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ name: newName, user_id: userId })
    }));
};

export const deleteCategory = async (name: string, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, { method: 'DELETE' }));
};

// ==================== PRODUCTS ====================
export const fetchProducts = async (_userId: string): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/products`);
    const data = await readJson(res);
    return data.products || [];
};

export const addProduct = async (product: Omit<Product, 'id'>, _userId: string): Promise<Product> => {
    const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category,
            price: product.price,
            cost_price: product.cost || 0,
            stock_quantity: product.stock,
            reorder_threshold: product.reorderLevel,
            supplier_id: product.supplierId,
            backup_supplier_ids: (product.supplierIds || []).filter(id => id !== product.supplierId),
            warehouse_id: product.warehouseId,
            image_url: product.imageUrl
        })
    });
    const data = await readJson(res);
    return data.product;
};

export const updateProduct = async (product: Product, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/products/${product.id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category,
            price: product.price,
            cost_price: product.cost || 0,
            stock_quantity: product.stock,
            reorder_threshold: product.reorderLevel,
            supplier_id: product.supplierId,
            backup_supplier_ids: (product.supplierIds || []).filter(id => id !== product.supplierId),
            warehouse_id: product.warehouseId,
            image_url: product.imageUrl
        })
    }));
};

export const deleteProduct = async (id: string, _userId: string): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' }));
};

// ==================== SALES ====================
export const fetchSales = async (_userId: string): Promise<Sale[]> => {
    const res = await fetch(`${API_BASE}/sales`);
    const data = await readJson(res);
    return data.sales || [];
};

export const addSale = async (productId: string, quantity: number, _userId: string): Promise<Sale> => {
    const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            product_id: productId,
            quantity
        })
    });
    const data = await readJson(res);
    return data.sale;
};

// ==================== ACTIVITY LOG ====================
export interface DbActivityLog {
    id: string;
    action: 'add' | 'update' | 'delete';
    entity_type: 'product' | 'supplier' | 'warehouse' | 'category' | 'sale' | 'order';
    entity_name: string;
    details: string | null;
    created_at: string;
}

export const fetchActivityLog = async (userId: string): Promise<DbActivityLog[]> => {
    const res = await fetch(`${API_BASE}/activity-log?user_id=${encodeURIComponent(userId)}&limit=100`);
    const data = await readJson(res);
    return data.entries || [];
};

export const logActivity = async (
    action: 'add' | 'update' | 'delete',
    entityType: 'product' | 'supplier' | 'warehouse' | 'category' | 'sale' | 'order',
    entityName: string,
    userId: string,
    details?: string
): Promise<void> => {
    await readJson(await fetch(`${API_BASE}/activity-log`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_name: entityName,
            details
        })
    }));
};

// ==================== STOCK TRANSFERS ====================
export const fetchStockTransfers = async (_userId: string): Promise<StockTransfer[]> => {
    const res = await fetch(`${API_BASE}/stock-transfers`);
    const data = await readJson(res);
    return data.transfers || [];
};

export const createStockTransfer = async (transfer: Omit<StockTransfer, 'id' | 'createdAt'>, _userId: string): Promise<StockTransfer> => {
    const res = await fetch(`${API_BASE}/stock-transfers`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            product_id: transfer.productId,
            from_warehouse_id: transfer.fromWarehouseId,
            to_warehouse_id: transfer.toWarehouseId,
            quantity: transfer.quantity,
            notes: transfer.notes
        })
    });
    const data = await readJson(res);
    return data.transfer;
};
