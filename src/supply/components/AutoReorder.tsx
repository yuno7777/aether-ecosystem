// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { X, Send, Package, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { Supplier, ProductAnalytics } from '../types';

interface AutoReorderProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
    analytics: ProductAnalytics[];
}

interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export const AutoReorder: React.FC<AutoReorderProps> = ({
    isOpen,
    onClose,
    supplier,
    analytics
}) => {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    // Get products that need reorder for this supplier
    const reorderProducts = analytics.filter(a =>
        a.product.supplierId === supplier?.id && a.suggestedReorderQty > 0
    );

    React.useEffect(() => {
        if (isOpen && supplier) {
            setOrderItems(reorderProducts.map(a => ({
                productId: a.product.id,
                productName: a.product.name,
                quantity: a.suggestedReorderQty,
                price: a.product.cost || a.product.price * 0.6
            })));
            setSent(false);
            setSending(false);
        }
    }, [isOpen, supplier]);

    const updateQuantity = (productId: string, qty: number) => {
        setOrderItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, quantity: Math.max(0, qty) } : item
        ));
    };

    const totalValue = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleSendOrder = () => {
        setSending(true);
        // Simulate API/email sending
        setTimeout(() => {
            setSending(false);
            setSent(true);
        }, 1500);
    };

    if (!isOpen || !supplier) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Send className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Quick Order</h2>
                            <p className="text-sm text-muted-foreground">{supplier.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {sent ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Order Placed!</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Order confirmation sent to <span className="text-foreground">{supplier.contactEmail}</span>
                            </p>
                            <div className="bg-muted/30 rounded-lg p-4 text-left">
                                <p className="text-xs text-muted-foreground mb-1">Order Summary</p>
                                <p className="text-sm text-foreground">{totalItems} items • ₹{totalValue.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-2">Expected delivery: {supplier.leadTimeDays} days</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Supplier Info */}
                            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg mb-4">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-foreground">{supplier.contactEmail}</p>
                                    <p className="text-xs text-muted-foreground">Lead time: {supplier.leadTimeDays} days</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            {orderItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No products need reorder from this supplier</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-muted-foreground">Order Items</p>
                                    {orderItems.map(item => (
                                        <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground truncate">{item.productName}</p>
                                                <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 5)}
                                                    className="w-7 h-7 rounded bg-muted hover:bg-muted/80 text-foreground text-xs"
                                                >
                                                    -5
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                    className="w-16 text-center bg-muted border border-border rounded px-2 py-1 text-sm text-foreground"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 5)}
                                                    className="w-7 h-7 rounded bg-muted hover:bg-muted/80 text-foreground text-xs"
                                                >
                                                    +5
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Total */}
                            {orderItems.length > 0 && (
                                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Total Order Value</span>
                                        <span className="text-xl font-bold text-foreground">₹{totalValue.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{totalItems} total units</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {sent ? 'Close' : 'Cancel'}
                    </button>
                    {!sent && orderItems.length > 0 && (
                        <button
                            onClick={handleSendOrder}
                            disabled={sending || totalItems === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Place Order
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
