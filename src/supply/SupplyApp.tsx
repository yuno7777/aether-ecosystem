// @ts-nocheck
"use client";
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, Sale, Supplier, ProductAnalytics, Warehouse, SupplierDelivery, StockTransfer as StockTransferType } from './types';
import { calculateProductAnalytics, getAggregatedStats } from './services/inventoryService';
import * as dataService from './services/dataService';
import * as mockData from './services/mockData';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { SmartReorder } from './components/SmartReorder';
import { SalesLog } from './components/SalesLog';
import { Suppliers } from './components/Suppliers';
import { Intelligence } from './components/Intelligence';
import { AIChatbot } from './components/AIChatbot';
import { AnomalyDetection } from './components/AnomalyDetection';
import { StockoutPredictionView } from './components/StockoutPrediction';
import { PurchaseOrders } from './components/PurchaseOrders';
import { PriceOptimizer } from './components/PriceOptimizer';
import { CategoryAnalytics } from './components/CategoryAnalytics';
import { ProfitMargins } from './components/ProfitMargins';
import { TrendComparison } from './components/TrendComparison';
import { StockAlerts } from './components/StockAlerts';
import { WarehouseView } from './components/WarehouseView';
import { SupplierManager } from './components/SupplierManager';
import { WarehouseManager } from './components/WarehouseManager';
import { CategoryManager } from './components/CategoryManager';
import { ActivityLog, ActivityLogEntry } from './components/ActivityLog';
import { StockTransfer } from './components/StockTransfer';
import { DemandForecast } from './components/DemandForecast';
import { BarcodeScanner } from './components/BarcodeScanner';
import { SupplierAlerts } from './components/SupplierAlerts';
import { Building2, Warehouse as WarehouseIcon, Tag, Settings, Loader2 } from 'lucide-react';

export default function SupplyApp() {
    const userId = 'demo-user';
    const [currentView, setCurrentView] = useState('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [deliveries] = useState<SupplierDelivery[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stockTransfers, setStockTransfers] = useState<StockTransferType[]>([]);

    // Fetch data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setDataLoading(true);
                const [productsData, salesData, suppliersData, warehousesData, categoriesData, activityData] = await Promise.all([
                    dataService.fetchProducts(userId),
                    dataService.fetchSales(userId),
                    dataService.fetchSuppliers(userId),
                    dataService.fetchWarehouses(userId),
                    dataService.fetchCategories(userId),
                    dataService.fetchActivityLog(userId)
                ]);
                let transfersData: StockTransferType[] = [];
                try { transfersData = await dataService.fetchStockTransfers(userId); } catch (e) { console.log('Stock transfers table not ready'); }
                setProducts(productsData);
                setSales(salesData);
                setSuppliers(suppliersData);
                setWarehouses(warehousesData);
                setCategories(categoriesData);
                setStockTransfers(transfersData);
                setActivityLog(activityData.map(a => ({
                    id: a.id,
                    action: a.action,
                    entityType: a.entity_type,
                    entityName: a.entity_name,
                    user: 'User',
                    timestamp: new Date(a.created_at),
                    details: a.details || undefined
                })));
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Database not connected. Running with rich demo data instead.');
                // Fallback to rich mock data
                setProducts(mockData.mockProducts);
                setSales(mockData.mockSales);
                setSuppliers(mockData.mockSuppliers);
                setWarehouses(mockData.mockWarehouses);
                setCategories(mockData.mockCategories);
                setStockTransfers(mockData.mockStockTransfers);
                setActivityLog(mockData.mockActivityLog);
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, []);

    // All categories (from products + custom)
    const allCategories = useMemo(() => {
        const productCategories = [...new Set(products.map(p => p.category))];
        return [...new Set([...productCategories, ...categories])];
    }, [products, categories]);

    // Manager modal states
    const [showSupplierManager, setShowSupplierManager] = useState(false);
    const [showWarehouseManager, setShowWarehouseManager] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // Activity Log state
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

    // Analytics
    const analytics: ProductAnalytics[] = useMemo(() => {
        return products.map(p => calculateProductAnalytics(p, sales, suppliers));
    }, [products, sales, suppliers]);

    const stats = useMemo(() => getAggregatedStats(analytics), [analytics]);

    // Helper to log activity
    const logActivityHandler = useCallback(async (action: ActivityLogEntry['action'], entityType: ActivityLogEntry['entityType'], entityName: string, details?: string) => {
        const entry: ActivityLogEntry = {
            id: `log-${Date.now()}`,
            action,
            entityType,
            entityName,
            user: 'User',
            timestamp: new Date(),
            details
        };
        setActivityLog(prev => [entry, ...prev]);
        await dataService.logActivity(action, entityType, entityName, userId, details);
    }, [userId]);

    // Product Handlers
    const handleAddSale = async (productId: string, qty: number) => {
        try {
            const newSale = await dataService.addSale(productId, qty, userId);
            setSales(prev => [newSale, ...prev]);
            const refreshedProducts = await dataService.fetchProducts(userId);
            setProducts(refreshedProducts);
        } catch (err) {
            console.error('Failed to add sale:', err);
        }
    };

    const handleAddProduct = async (newProductData: Omit<Product, 'id'>) => {
        try {
            const newProduct = await dataService.addProduct(newProductData, userId);
            setProducts(prev => [newProduct, ...prev]);
            await logActivityHandler('add', 'product', newProductData.name);
        } catch (err) {
            console.error('Failed to add product:', err);
        }
    };

    const handleUpdateProduct = async (updatedProduct: Product) => {
        try {
            await dataService.updateProduct(updatedProduct, userId);
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            await logActivityHandler('update', 'product', updatedProduct.name);
        } catch (err) {
            console.error('Failed to update product:', err);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        const product = products.find(p => p.id === productId);
        try {
            await dataService.deleteProduct(productId, userId);
            setProducts(prev => prev.filter(p => p.id !== productId));
            if (product) await logActivityHandler('delete', 'product', product.name);
        } catch (err) {
            console.error('Failed to delete product:', err);
        }
    };

    // Supplier Handlers
    const handleAddSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
        try {
            const newSupplier = await dataService.addSupplier(supplierData, userId);
            setSuppliers(prev => [...prev, newSupplier]);
            await logActivityHandler('add', 'supplier', supplierData.name);
        } catch (err) {
            console.error('Failed to add supplier:', err);
        }
    };

    const handleUpdateSupplier = async (supplier: Supplier) => {
        try {
            await dataService.updateSupplier(supplier, userId);
            setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
            await logActivityHandler('update', 'supplier', supplier.name);
        } catch (err) {
            console.error('Failed to update supplier:', err);
        }
    };

    const handleDeleteSupplier = async (id: string) => {
        const supplier = suppliers.find(s => s.id === id);
        try {
            await dataService.deleteSupplier(id, userId);
            setSuppliers(prev => prev.filter(s => s.id !== id));
            if (supplier) await logActivityHandler('delete', 'supplier', supplier.name);
        } catch (err) {
            console.error('Failed to delete supplier:', err);
        }
    };

    // Warehouse Handlers
    const handleAddWarehouse = async (warehouseData: Omit<Warehouse, 'id'>) => {
        try {
            const newWarehouse = await dataService.addWarehouse(warehouseData, userId);
            setWarehouses(prev => [...prev, newWarehouse]);
            await logActivityHandler('add', 'warehouse', warehouseData.name);
        } catch (err) {
            console.error('Failed to add warehouse:', err);
        }
    };

    const handleUpdateWarehouse = async (warehouse: Warehouse) => {
        try {
            await dataService.updateWarehouse(warehouse, userId);
            setWarehouses(prev => prev.map(w => w.id === warehouse.id ? warehouse : w));
            await logActivityHandler('update', 'warehouse', warehouse.name);
        } catch (err) {
            console.error('Failed to update warehouse:', err);
        }
    };

    const handleDeleteWarehouse = async (id: string) => {
        const warehouse = warehouses.find(w => w.id === id);
        try {
            await dataService.deleteWarehouse(id, userId);
            setWarehouses(prev => prev.filter(w => w.id !== id));
            if (warehouse) await logActivityHandler('delete', 'warehouse', warehouse.name);
        } catch (err) {
            console.error('Failed to delete warehouse:', err);
        }
    };

    // Category Handlers
    const handleAddCategory = async (category: string) => {
        if (!allCategories.includes(category)) {
            try {
                await dataService.addCategory(category, userId);
                setCategories(prev => [...prev, category]);
                await logActivityHandler('add', 'category', category);
            } catch (err) {
                console.error('Failed to add category:', err);
            }
        }
    };

    const handleUpdateCategory = async (oldName: string, newName: string) => {
        try {
            await dataService.updateCategory(oldName, newName, userId);
            setCategories(prev => prev.map(c => c === oldName ? newName : c));
            setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
            await logActivityHandler('update', 'category', newName, `Renamed from ${oldName}`);
        } catch (err) {
            console.error('Failed to update category:', err);
        }
    };

    const handleDeleteCategory = async (category: string) => {
        try {
            await dataService.deleteCategory(category, userId);
            setCategories(prev => prev.filter(c => c !== category));
            await logActivityHandler('delete', 'category', category);
        } catch (err) {
            console.error('Failed to delete category:', err);
        }
    };

    const renderContent = () => {
        if (dataLoading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground mt-2">Loading your data...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            // Show error banner but don't block UI
        }

        switch (currentView) {
            case 'dashboard':
                return (
                    <>
                        <Dashboard analytics={analytics} totalValue={stats.totalValue} />
                        <div className="mt-6">
                            <StockAlerts analytics={analytics} />
                        </div>
                        <div className="mt-6">
                            <AnomalyDetection analytics={analytics} sales={sales} />
                        </div>
                    </>
                );
            case 'inventory':
                return (
                    <ProductList
                        analytics={analytics}
                        onAddProduct={handleAddProduct}
                        onUpdateProduct={handleUpdateProduct}
                        onDeleteProduct={handleDeleteProduct}
                        suppliers={suppliers}
                        warehouses={warehouses}
                        categories={allCategories}
                    />
                );
            case 'reorder':
                return (
                    <>
                        <SmartReorder analytics={analytics} />
                        <div className="mt-6">
                            <StockoutPredictionView analytics={analytics} sales={sales} />
                        </div>
                    </>
                );
            case 'sales':
                return <SalesLog sales={sales} products={products} onAddSale={handleAddSale} />;
            case 'suppliers':
                return <Suppliers suppliers={suppliers} deliveries={deliveries} analytics={analytics} products={products} />;
            case 'supplier-alerts':
                return <SupplierAlerts analytics={analytics} suppliers={suppliers} />;
            case 'intelligence':
                return <Intelligence analytics={analytics} sales={sales} />;
            case 'purchase-orders':
                return <PurchaseOrders analytics={analytics} suppliers={suppliers} products={products} />;
            case 'scanner':
                return <BarcodeScanner products={products} onUpdateStock={(productId, newStock) => {
                    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
                }} />;
            case 'pricing':
                return <PriceOptimizer analytics={analytics} />;
            case 'category-analytics':
                return <CategoryAnalytics analytics={analytics} />;
            case 'profit-margins':
                return <ProfitMargins analytics={analytics} />;
            case 'trends':
                return <TrendComparison analytics={analytics} sales={sales} />;
            case 'stock-alerts':
                return <StockAlerts analytics={analytics} />;
            case 'warehouses':
                return <WarehouseView analytics={analytics} warehouses={warehouses} />;
            case 'stock-transfer':
                return (
                    <StockTransfer
                        products={products}
                        warehouses={warehouses}
                        transfers={stockTransfers}
                        onTransfer={async (transfer) => {
                            const newTransfer = await dataService.createStockTransfer(transfer, userId);
                            setStockTransfers(prev => [newTransfer, ...prev]);
                            await logActivityHandler('add', 'product', products.find(p => p.id === transfer.productId)?.name || 'Product', `Stock transfer: ${transfer.quantity} units`);
                        }}
                    />
                );
            case 'demand-forecast':
                return <DemandForecast analytics={analytics} sales={sales} />;
            case 'activity-log':
                return <ActivityLog entries={activityLog} />;
            case 'settings':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                                Settings <Settings className="w-6 h-6 text-purple-400" />
                            </h1>
                            <p className="text-muted-foreground mt-1">Manage your suppliers, warehouses, and categories.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setShowSupplierManager(true)}
                                className="p-6 rounded-xl border border-border bg-card hover:border-blue-500/50 transition-all group"
                            >
                                <div className="p-3 bg-blue-500/10 rounded-lg w-fit mb-3 group-hover:bg-blue-500/20">
                                    <Building2 className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-foreground text-left">Manage Suppliers</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-left">{suppliers.length} suppliers</p>
                            </button>

                            <button
                                onClick={() => setShowWarehouseManager(true)}
                                className="p-6 rounded-xl border border-border bg-card hover:border-purple-500/50 transition-all group"
                            >
                                <div className="p-3 bg-purple-500/10 rounded-lg w-fit mb-3 group-hover:bg-purple-500/20">
                                    <WarehouseIcon className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="font-semibold text-foreground text-left">Manage Warehouses</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-left">{warehouses.length} warehouses</p>
                            </button>

                            <button
                                onClick={() => setShowCategoryManager(true)}
                                className="p-6 rounded-xl border border-border bg-card hover:border-amber-500/50 transition-all group"
                            >
                                <div className="p-3 bg-amber-500/10 rounded-lg w-fit mb-3 group-hover:bg-amber-500/20">
                                    <Tag className="w-6 h-6 text-amber-400" />
                                </div>
                                <h3 className="font-semibold text-foreground text-left">Manage Categories</h3>
                                <p className="text-sm text-muted-foreground mt-1 text-left">{allCategories.length} categories</p>
                            </button>
                        </div>
                    </div>
                );
            default:
                return <Dashboard analytics={analytics} totalValue={stats.totalValue} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
            <Sidebar
                currentView={currentView}
                onViewChange={setCurrentView}
            />

            <main className="main-content flex-1 ml-64 p-8 max-w-[1600px] mx-auto w-full min-h-screen">
                {!['intelligence', 'purchase-orders', 'pricing', 'category-analytics', 'profit-margins', 'trends', 'dashboard', 'settings', 'activity-log'].includes(currentView) && (
                    <header className="mb-8 flex justify-between items-center border-b border-border pb-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight capitalize text-foreground">{currentView.replace('-', ' ')}</h2>
                            <p className="text-muted-foreground mt-1">Manage your supply chain and inventory metrics.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-950/30 text-purple-400 rounded-full border border-purple-900/50 text-sm font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                </span>
                                System Operational
                            </div>
                        </div>
                    </header>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm flex items-center justify-between">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)} className="text-amber-400 hover:text-amber-200 ml-4 text-xs">Dismiss</button>
                    </div>
                )}

                {renderContent()}
            </main>

            {/* Floating AI Chatbot */}
            <AIChatbot
                analytics={analytics}
                sales={sales}
                suppliers={suppliers}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
            />

            {/* Manager Modals */}
            <SupplierManager
                isOpen={showSupplierManager}
                onClose={() => setShowSupplierManager(false)}
                suppliers={suppliers}
                onAdd={handleAddSupplier}
                onUpdate={handleUpdateSupplier}
                onDelete={handleDeleteSupplier}
            />

            <WarehouseManager
                isOpen={showWarehouseManager}
                onClose={() => setShowWarehouseManager(false)}
                warehouses={warehouses}
                onAdd={handleAddWarehouse}
                onUpdate={handleUpdateWarehouse}
                onDelete={handleDeleteWarehouse}
            />

            <CategoryManager
                isOpen={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                categories={allCategories}
                onAdd={handleAddCategory}
                onUpdate={handleUpdateCategory}
                onDelete={handleDeleteCategory}
            />
        </div>
    );
}
