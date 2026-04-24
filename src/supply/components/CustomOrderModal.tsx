// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Mail, Loader2, CheckCircle, Package, Trash2 } from 'lucide-react';
import { Supplier, Product } from '../types';
import { PurchaseOrder, PurchaseOrderItem, generateAIEmail, generateMailtoLink } from '../services/purchaseOrderService';

interface CustomOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    products: Product[];
}

interface OrderLineItem {
    productId: string;
    quantity: number;
}

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({
    isOpen,
    onClose,
    suppliers,
    products
}) => {
    const [step, setStep] = useState<'create' | 'preview' | 'sent'>('create');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [orderItems, setOrderItems] = useState<OrderLineItem[]>([]);
    const [notes, setNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [emailContent, setEmailContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('create');
            setSelectedSupplier('');
            setOrderItems([]);
            setNotes('');
            setEmailContent('');
        }
    }, [isOpen]);

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    const supplierProducts = products.filter(p =>
        p.supplierId === selectedSupplier || p.supplierIds?.includes(selectedSupplier)
    );

    const addProduct = (productId: string) => {
        if (!orderItems.find(i => i.productId === productId)) {
            setOrderItems(prev => [...prev, { productId, quantity: 10 }]);
        }
    };

    const updateQuantity = (productId: string, qty: number) => {
        setOrderItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, quantity: Math.max(1, qty) } : item
        ));
    };

    const removeItem = (productId: string) => {
        setOrderItems(prev => prev.filter(i => i.productId !== productId));
    };

    const buildPurchaseOrder = (): PurchaseOrder | null => {
        if (!supplier) return null;

        const items: PurchaseOrderItem[] = orderItems.map(item => {
            const product = products.find(p => p.id === item.productId)!;
            const unitPrice = product.cost || product.price * 0.6;
            return {
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                unitPrice,
                totalPrice: item.quantity * unitPrice
            };
        });

        const totalValue = items.reduce((sum, i) => sum + i.totalPrice, 0);

        return {
            id: `PO-CUSTOM-${Date.now()}`,
            supplier,
            items,
            totalValue,
            status: 'draft',
            createdAt: new Date(),
            emailDraft: '',
            urgency: 'normal'
        };
    };

    const handleGenerateEmail = async () => {
        const order = buildPurchaseOrder();
        if (!order) return;

        setIsGenerating(true);

        try {
            let email = await generateAIEmail(order);

            // Append custom notes if provided
            if (notes.trim()) {
                email = email.replace(
                    'Best regards,',
                    `Additional Notes:\n${notes}\n\nBest regards,`
                );
            }

            // Replace $ with ₹
            email = email.replace(/\$/g, '₹');

            setEmailContent(email);
            setStep('preview');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendEmail = () => {
        const order = buildPurchaseOrder();
        if (!order) return;

        const mailtoLink = generateMailtoLink(order, emailContent);
        window.open(mailtoLink, '_blank');
        setStep('sent');
    };

    const totalValue = orderItems.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        const price = product?.cost || (product?.price || 0) * 0.6;
        return sum + item.quantity * price;
    }, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Package className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                {step === 'sent' ? 'Order Sent!' : step === 'preview' ? 'Preview Email' : 'Create Custom Order'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {step === 'create' ? 'Select supplier and products' : step === 'preview' ? 'Review and send' : 'Email opened'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {step === 'sent' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Email Opened!</h3>
                            <p className="text-sm text-muted-foreground">
                                Your email client should have opened with the purchase order ready to send.
                            </p>
                        </div>
                    ) : step === 'preview' ? (
                        <div className="space-y-4">
                            {/* Order Summary */}
                            <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-foreground">{supplier?.name}</span>
                                    <span className="text-sm text-muted-foreground">{supplier?.contactEmail}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {orderItems.length} items • Total: ₹{totalValue.toLocaleString()}
                                </div>
                            </div>

                            {/* Email Preview */}
                            <div className="bg-neutral-900 rounded-lg border border-border p-4 max-h-[300px] overflow-y-auto">
                                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                                    {emailContent}
                                </pre>
                            </div>

                            <button onClick={() => setStep('create')} className="text-sm text-muted-foreground hover:text-foreground">
                                ← Back to edit
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Select Supplier *</label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => {
                                        setSelectedSupplier(e.target.value);
                                        setOrderItems([]);
                                    }}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground"
                                >
                                    <option value="">Choose a supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.contactEmail})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Selection */}
                            {selectedSupplier && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Add Product</label>
                                    <div className="flex gap-2">
                                        <select
                                            id="product-select"
                                            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground"
                                            defaultValue=""
                                        >
                                            <option value="">Select a product to add</option>
                                            {products.filter(p => !orderItems.find(i => i.productId === p.id)).map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (₹{(p.cost || p.price * 0.6).toFixed(2)})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const select = document.getElementById('product-select') as HTMLSelectElement;
                                                if (select.value) {
                                                    addProduct(select.value);
                                                    select.value = '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {products.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">No products available</p>
                                    )}
                                </div>
                            )}

                            {/* Order Items */}
                            {orderItems.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Order Items</label>
                                    <div className="space-y-2">
                                        {orderItems.map(item => {
                                            const product = products.find(p => p.id === item.productId);
                                            const price = product?.cost || (product?.price || 0) * 0.6;
                                            return (
                                                <div key={item.productId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{product?.name}</p>
                                                        <p className="text-xs text-muted-foreground">₹{price.toFixed(2)} each</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 5)}
                                                            className="w-7 h-7 rounded bg-muted hover:bg-muted/80 flex items-center justify-center"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                            className="w-16 text-center bg-muted border border-border rounded px-2 py-1 text-sm"
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 5)}
                                                            className="w-7 h-7 rounded bg-muted hover:bg-muted/80 flex items-center justify-center"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeItem(item.productId)}
                                                            className="w-7 h-7 rounded bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground w-24 text-right">
                                                        ₹{(item.quantity * price).toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Total Order Value</span>
                                        <span className="text-lg font-bold text-foreground">₹{totalValue.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {orderItems.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Additional Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm resize-none"
                                        placeholder="Add any special instructions or notes..."
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {step === 'sent' ? 'Close' : 'Cancel'}
                    </button>

                    {step === 'create' && orderItems.length > 0 && (
                        <button
                            onClick={handleGenerateEmail}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4" />
                                    Generate Email
                                </>
                            )}
                        </button>
                    )}

                    {step === 'preview' && (
                        <button
                            onClick={handleSendEmail}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            Open in Email Client
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
