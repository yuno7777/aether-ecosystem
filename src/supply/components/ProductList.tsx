// @ts-nocheck
"use client";
import React, { useState, useMemo } from 'react';
import { ProductAnalytics, StockStatus, StockMovement, DemandTrend, Supplier, Product, Warehouse } from '../types';
import { Search, Plus, Filter, Edit2, Trash2, Upload, Barcode, Package } from 'lucide-react';
import { ProductModal } from './ProductModal';
import { BulkImport } from './BulkImport';
import { AdvancedFilter, FilterState, emptyFilters } from './AdvancedFilter';

interface ProductListProps {
  analytics: ProductAnalytics[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  categories: string[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  analytics,
  suppliers,
  warehouses,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '').length;
  }, [filters]);

  const filteredData = useMemo(() => {
    return analytics.filter(a => {
      // Search filter
      const matchesSearch = !searchTerm ||
        a.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = !filters.category || a.product.category === filters.category;

      // Status filter
      const matchesStatus = !filters.status || a.status === filters.status;

      // Trend filter
      const matchesTrend = !filters.trend || a.demandTrend === filters.trend;

      // Warehouse filter
      const matchesWarehouse = !filters.warehouseId || a.product.warehouseId === filters.warehouseId;

      // Supplier filter
      const matchesSupplier = !filters.supplierId || a.product.supplierId === filters.supplierId;

      // Price range filter
      const matchesPriceMin = !filters.priceMin || a.product.price >= parseFloat(filters.priceMin);
      const matchesPriceMax = !filters.priceMax || a.product.price <= parseFloat(filters.priceMax);

      return matchesSearch && matchesCategory && matchesStatus && matchesTrend &&
        matchesWarehouse && matchesSupplier && matchesPriceMin && matchesPriceMax;
    });
  }, [analytics, searchTerm, filters]);

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case StockStatus.NORMAL: return <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">Normal</span>;
      case StockStatus.LOW: return <span className="inline-flex items-center rounded-full border border-yellow-900/50 bg-yellow-900/20 px-2.5 py-0.5 text-xs font-medium text-yellow-500">Low Stock</span>;
      case StockStatus.CRITICAL: return <span className="inline-flex items-center rounded-full border border-red-900/50 bg-red-900/20 px-2.5 py-0.5 text-xs font-medium text-red-500">Critical</span>;
      case StockStatus.OVERSTOCKED: return <span className="inline-flex items-center rounded-full border border-blue-900/50 bg-blue-900/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">Overstocked</span>;
    }
  };

  const getTrendIcon = (trend: DemandTrend) => {
    switch (trend) {
      case DemandTrend.INCREASING: return <div className="flex items-center text-purple-400 font-medium text-xs"><span className="mr-1.5 text-purple-500">↑</span> Rising</div>;
      case DemandTrend.DECLINING: return <div className="flex items-center text-red-400 font-medium text-xs"><span className="mr-1.5 text-red-500">↓</span> Falling</div>;
      default: return <div className="text-muted-foreground text-xs">Stable</div>;
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData && onUpdateProduct) {
      onUpdateProduct(productData as Product);
    } else {
      onAddProduct(productData as Omit<Product, 'id'>);
    }
  };

  const handleBulkImport = (products: Omit<Product, 'id'>[]) => {
    products.forEach(product => onAddProduct(product));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, category, or SKU..."
              className="shadcn-input pl-9 w-[300px] bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shadcn-btn border bg-card text-foreground relative ${showFilters ? 'border-primary text-primary' : 'border-input hover:bg-muted'}`}
          >
            <Filter className="mr-2 h-4 w-4" /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="shadcn-btn border border-input bg-card hover:bg-muted text-foreground"
          >
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="shadcn-btn bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <AdvancedFilter
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        suppliers={suppliers}
        warehouses={warehouses}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        activeFilterCount={activeFilterCount}
      />

      {/* Results Count */}
      {(searchTerm || activeFilterCount > 0) && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredData.length} of {analytics.length} products
        </p>
      )}

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Stock</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Trend</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Price</th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((item) => (
                <tr key={item.product.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      {item.product.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">{item.product.name}</div>
                        {item.product.barcode && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Barcode className="w-3 h-3" /> {item.product.barcode}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.product.sku}</code>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">{item.product.category}</td>
                  <td className="p-4 align-middle text-right font-mono text-foreground">{item.product.stock}</td>
                  <td className="p-4 align-middle">{getStatusBadge(item.status)}</td>
                  <td className="p-4 align-middle">{getTrendIcon(item.demandTrend)}</td>
                  <td className="p-4 align-middle text-right text-muted-foreground">₹{item.product.price.toFixed(2)}</td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item.product)}
                        className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {onDeleteProduct && (
                        <button
                          onClick={() => onDeleteProduct(item.product.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {activeFilterCount > 0
                      ? 'No products match your filters. Try adjusting or clearing filters.'
                      : 'No products found matching your search.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={onDeleteProduct}
        product={editingProduct}
        suppliers={suppliers}
        warehouses={warehouses}
        mode={modalMode}
      />

      {/* Bulk Import Modal */}
      <BulkImport
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        suppliers={suppliers}
        warehouses={warehouses}
      />
    </div>
  );
};