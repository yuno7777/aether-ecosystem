// @ts-nocheck
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Package, MapPin, Clock, Search, Filter, Plus, ChevronDown } from 'lucide-react';
import { Product, Warehouse, StockTransfer as StockTransferType } from '../types';

interface StockTransferProps {
    products: Product[];
    warehouses: Warehouse[];
    transfers: StockTransferType[];
    onTransfer: (transfer: Omit<StockTransferType, 'id' | 'createdAt'>) => Promise<void>;
}

export const StockTransfer: React.FC<StockTransferProps> = ({ products, warehouses, transfers, onTransfer }) => {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: 1,
        notes: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Get product name by id
    const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
    const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || 'Unknown';

    // Products with warehouse assignment
    const productsWithWarehouse = useMemo(() =>
        products.filter(p => p.warehouseId),
        [products]
    );

    // Available warehouses for "to" (exclude selected "from")
    const toWarehouses = useMemo(() =>
        warehouses.filter(w => w.id !== formData.fromWarehouseId),
        [warehouses, formData.fromWarehouseId]
    );

    // Filter transfers
    const filteredTransfers = useMemo(() => {
        if (!searchTerm) return transfers;
        const term = searchTerm.toLowerCase();
        return transfers.filter(t =>
            getProductName(t.productId).toLowerCase().includes(term) ||
            getWarehouseName(t.fromWarehouseId).toLowerCase().includes(term) ||
            getWarehouseName(t.toWarehouseId).toLowerCase().includes(term)
        );
    }, [transfers, searchTerm, products, warehouses]);

    // Stats
    const stats = useMemo(() => ({
        totalTransfers: transfers.length,
        totalQuantity: transfers.reduce((sum, t) => sum + t.quantity, 0),
        uniqueProducts: new Set(transfers.map(t => t.productId)).size,
        thisMonth: transfers.filter(t => {
            const d = new Date(t.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length
    }), [transfers]);

    const validate = () => {
        if (!formData.productId) return 'Please select a product';
        if (!formData.fromWarehouseId) return 'Please select source warehouse';
        if (!formData.toWarehouseId) return 'Please select destination warehouse';
        if (formData.fromWarehouseId === formData.toWarehouseId) return 'Source and destination must be different';
        if (formData.quantity < 1) return 'Quantity must be at least 1';

        const product = products.find(p => p.id === formData.productId);
        if (product && formData.quantity > product.stock) {
            return `Insufficient stock. Available: ${product.stock} units`;
        }
        return '';
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            await onTransfer({
                productId: formData.productId,
                fromWarehouseId: formData.fromWarehouseId,
                toWarehouseId: formData.toWarehouseId,
                quantity: formData.quantity,
                notes: formData.notes || undefined
            });
            setSuccess(`Successfully transferred ${formData.quantity} units`);
            setFormData({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: 1, notes: '' });
            setShowForm(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Transfer failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectClass = "w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Stock Transfers</h3>
                        <p className="text-sm text-muted-foreground">Move inventory between warehouse locations</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="shadcn-btn bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Transfer
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm">
                    ✓ {success}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Transfers</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTransfers}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Items Moved</p>
                    <p className="text-2xl font-bold text-orange-400">{stats.totalQuantity.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Unique Products</p>
                    <p className="text-2xl font-bold text-foreground">{stats.uniqueProducts}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.thisMonth}</p>
                </div>
            </div>

            {/* New Transfer Form */}
            {showForm && (
                <div className="rounded-xl border border-border bg-card p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-primary" /> Create Stock Transfer
                    </h4>
                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product */}
                        <div className="md:col-span-2">
                            <label className="block text-xs text-muted-foreground mb-1">Product *</label>
                            <select
                                value={formData.productId}
                                onChange={(e) => {
                                    const product = products.find(p => p.id === e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        productId: e.target.value,
                                        fromWarehouseId: product?.warehouseId || ''
                                    }));
                                }}
                                className={selectClass}
                            >
                                <option value="">Select product to transfer</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Stock: {p.stock})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* From Warehouse */}
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">From Warehouse *</label>
                            <select
                                value={formData.fromWarehouseId}
                                onChange={(e) => setFormData(prev => ({ ...prev, fromWarehouseId: e.target.value }))}
                                className={selectClass}
                            >
                                <option value="">Select source</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} — {w.location}</option>
                                ))}
                            </select>
                        </div>

                        {/* To Warehouse */}
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">To Warehouse *</label>
                            <select
                                value={formData.toWarehouseId}
                                onChange={(e) => setFormData(prev => ({ ...prev, toWarehouseId: e.target.value }))}
                                className={selectClass}
                            >
                                <option value="">Select destination</option>
                                {toWarehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} — {w.location}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Quantity *</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                className={selectClass}
                                min="1"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Notes (optional)</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className={selectClass}
                                placeholder="Reason for transfer..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                        <button
                            onClick={() => { setShowForm(false); setError(''); }}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Transferring...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </div>
            )}

            {/* Transfer History */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h4 className="font-semibold text-foreground text-sm">Transfer History</h4>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search transfers..."
                            className="pl-8 pr-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs">Product</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs">From</th>
                                <th className="h-10 px-4 text-center font-medium text-muted-foreground text-xs">→</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs">To</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground text-xs">Qty</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs">Notes</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground text-xs">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredTransfers.length > 0 ? filteredTransfers.map(t => (
                                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium text-foreground">{getProductName(t.productId)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <MapPin className="w-3 h-3" />
                                            {getWarehouseName(t.fromWarehouseId)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <ArrowRightLeft className="w-4 h-4 text-orange-400 mx-auto" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <MapPin className="w-3 h-3" />
                                            {getWarehouseName(t.toWarehouseId)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-foreground">{t.quantity}</td>
                                    <td className="p-4 text-muted-foreground text-xs max-w-[200px] truncate">{t.notes || '—'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        {transfers.length === 0 ? 'No transfers yet. Create your first stock transfer above.' : 'No transfers matching your search.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
