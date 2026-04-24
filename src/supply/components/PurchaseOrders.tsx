// @ts-nocheck
"use client";
import React, { useState, useMemo } from 'react';
import { FileText, Mail, Copy, Check, ExternalLink, Loader2, Sparkles, Package, Truck, AlertTriangle, Plus, Download } from 'lucide-react';
import { ProductAnalytics, Supplier, Product } from '../types';
import { PurchaseOrder, generatePurchaseOrders, generateAIEmail, generateMailtoLink } from '../services/purchaseOrderService';
import { CustomOrderModal } from './CustomOrderModal';

interface PurchaseOrdersProps {
    analytics: ProductAnalytics[];
    suppliers?: Supplier[];
    products?: Product[];
}

const getUrgencyStyles = (urgency: PurchaseOrder['urgency']) => {
    switch (urgency) {
        case 'critical':
            return { bg: 'bg-red-500/10', border: 'border-red-900/50', text: 'text-red-400', badge: 'bg-red-500/20' };
        case 'urgent':
            return { bg: 'bg-amber-500/10', border: 'border-amber-900/50', text: 'text-amber-400', badge: 'bg-amber-500/20' };
        case 'normal':
            return { bg: 'bg-purple-500/10', border: 'border-purple-900/50', text: 'text-purple-400', badge: 'bg-purple-500/20' };
    }
};

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ analytics, suppliers = [], products = [] }) => {
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [emailContent, setEmailContent] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showCustomOrder, setShowCustomOrder] = useState(false);

    const orders = useMemo(() => generatePurchaseOrders(analytics), [analytics]);

    const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
    const criticalOrders = orders.filter(o => o.urgency === 'critical').length;

    const handleSelectOrder = async (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsGenerating(true);
        setCopied(false);

        try {
            const email = await generateAIEmail(order);
            setEmailContent(email);
        } catch (error) {
            console.error("Failed to generate email:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(emailContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async (order: PurchaseOrder) => {
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { PurchaseOrderTemplate } = await import('../../components/pdf/PurchaseOrderTemplate');
            const React = await import('react');

            const poData = {
                number: order.id,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                expectedDelivery: new Date(Date.now() + order.supplier.leadTimeDays * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                supplier: {
                    name: order.supplier.name,
                    email: order.supplier.contactEmail,
                    location: order.supplier.location || 'N/A',
                },
                items: order.items.map(item => ({
                    name: item.productName,
                    sku: item.productId,
                    quantity: item.quantity,
                    unitCost: item.unitCost || 0,
                })),
            };

            const blob = await pdf(React.createElement(PurchaseOrderTemplate, { data: poData })).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PO-${order.id}-${order.supplier.name.replace(/\s+/g, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
    };

    const handleOpenEmail = () => {
        if (selectedOrder) {
            const mailtoLink = generateMailtoLink(selectedOrder, emailContent);
            window.open(mailtoLink, '_blank');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        Purchase Orders <FileText className="w-6 h-6 text-blue-400" />
                    </h1>
                    <p className="text-muted-foreground mt-1">AI-generated purchase orders ready to send to suppliers.</p>
                </div>
                <button
                    onClick={() => setShowCustomOrder(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                >
                    <Plus className="w-4 h-4" />
                    Create Custom Order
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Orders</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Package className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Value</p>
                            <p className="text-2xl font-bold text-foreground mt-1">₹{totalValue.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Truck className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </div>
                {criticalOrders > 0 && (
                    <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-400/80">Critical Orders</p>
                                <p className="text-2xl font-bold text-red-400 mt-1">{criticalOrders}</p>
                            </div>
                            <div className="p-3 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders List */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h3 className="font-semibold text-foreground">Generated Orders</h3>
                        <p className="text-sm text-muted-foreground">Select an order to preview and send</p>
                    </div>

                    {orders.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No reorder suggestions available</p>
                            <p className="text-sm mt-1">All inventory levels are healthy</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                            {orders.map(order => {
                                const styles = getUrgencyStyles(order.urgency);
                                const isSelected = selectedOrder?.id === order.id;

                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => handleSelectOrder(order)}
                                        className={`w-full px-6 py-4 text-left transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-foreground">{order.supplier.name}</h4>
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${styles.badge} ${styles.text}`}>
                                                    {order.urgency}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-foreground">₹{order.totalValue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                                            <span>{order.supplier.leadTimeDays} day lead time</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Email Preview */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <h3 className="font-semibold text-foreground">AI Email Draft</h3>
                        </div>
                        {selectedOrder && !isGenerating && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => selectedOrder && handleDownloadPDF(selectedOrder)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg transition-colors border border-purple-500/20"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={handleOpenEmail}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    Open in Email
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 min-h-[400px]">
                        {!selectedOrder ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Mail className="w-12 h-12 mb-3 opacity-30" />
                                <p>Select an order to preview the email</p>
                            </div>
                        ) : isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Loader2 className="w-8 h-8 mb-3 animate-spin text-purple-400" />
                                <p>Generating AI-enhanced email...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Order Summary */}
                                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-2">Order Items</h4>
                                    <div className="space-y-1 text-sm">
                                        {selectedOrder.items.map(item => (
                                            <div key={item.productId} className="flex justify-between text-muted-foreground">
                                                <span>{item.productName}</span>
                                                <span>{item.quantity} units</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Email Content */}
                                <div className="bg-neutral-900 rounded-lg border border-border p-4">
                                    <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                                        {emailContent}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Order Modal */}
            <CustomOrderModal
                isOpen={showCustomOrder}
                onClose={() => setShowCustomOrder(false)}
                suppliers={suppliers}
                products={products}
            />
        </div>
    );
};
