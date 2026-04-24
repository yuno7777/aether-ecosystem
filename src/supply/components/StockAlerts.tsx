// @ts-nocheck
"use client";
import React, { useMemo, useState } from 'react';
import { Bell, BellRing, AlertTriangle, Check, Settings, Mail, X } from 'lucide-react';
import { ProductAnalytics, StockStatus } from '../types';

interface StockAlertsProps {
    analytics: ProductAnalytics[];
}

interface StockAlert {
    id: string;
    productId: string;
    productName: string;
    type: 'critical' | 'low' | 'out_of_stock';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    notificationSent: boolean;
}

export const StockAlerts: React.FC<StockAlertsProps> = ({ analytics }) => {
    const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
    const [showSettings, setShowSettings] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [criticalThreshold, setCriticalThreshold] = useState(5);
    const [lowThreshold, setLowThreshold] = useState(15);

    const alerts = useMemo((): StockAlert[] => {
        const now = new Date();
        return analytics
            .filter(a => a.status === StockStatus.CRITICAL || a.status === StockStatus.LOW || a.product.stock === 0)
            .map(a => {
                let type: StockAlert['type'];
                let message: string;

                if (a.product.stock === 0) {
                    type = 'out_of_stock';
                    message = `${a.product.name} is OUT OF STOCK! Immediate reorder required.`;
                } else if (a.status === StockStatus.CRITICAL) {
                    type = 'critical';
                    message = `${a.product.name} has only ${a.product.stock} units left (below ${criticalThreshold} threshold).`;
                } else {
                    type = 'low';
                    message = `${a.product.name} stock is low (${a.product.stock} units). Consider reordering soon.`;
                }

                return {
                    id: `alert-${a.product.id}`,
                    productId: a.product.id,
                    productName: a.product.name,
                    type,
                    message,
                    timestamp: new Date(now.getTime() - Math.random() * 3600000),
                    acknowledged: acknowledgedIds.has(`alert-${a.product.id}`),
                    notificationSent: emailNotifications && (type === 'critical' || type === 'out_of_stock')
                };
            })
            .sort((a, b) => {
                const typeOrder = { out_of_stock: 0, critical: 1, low: 2 };
                return typeOrder[a.type] - typeOrder[b.type];
            });
    }, [analytics, acknowledgedIds, emailNotifications, criticalThreshold, lowThreshold]);

    const handleAcknowledge = (alertId: string) => {
        setAcknowledgedIds(prev => new Set([...prev, alertId]));
    };

    const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg relative">
                        <Bell className="w-5 h-5 text-red-400" />
                        {unacknowledgedCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {unacknowledgedCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Stock Alerts</h3>
                        <p className="text-sm text-muted-foreground">
                            {alerts.length === 0 ? 'All stock levels are healthy' : `${alerts.length} item(s) need attention`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="rounded-xl border border-border bg-card p-4">
                    <h4 className="font-medium text-foreground mb-4">Alert Settings</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                                <p className="text-xs text-muted-foreground">Send email alerts for critical stock levels</p>
                            </div>
                            <button
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`w-11 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${emailNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground">Critical Threshold</label>
                                <input
                                    type="number"
                                    value={criticalThreshold}
                                    onChange={(e) => setCriticalThreshold(parseInt(e.target.value) || 0)}
                                    className="w-full mt-1 px-3 py-1.5 bg-muted border border-border rounded text-sm text-foreground"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    value={lowThreshold}
                                    onChange={(e) => setLowThreshold(parseInt(e.target.value) || 0)}
                                    className="w-full mt-1 px-3 py-1.5 bg-muted border border-border rounded text-sm text-foreground"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts List */}
            {alerts.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="font-medium text-foreground">All Clear!</p>
                    <p className="text-sm text-muted-foreground mt-1">No stock alerts at the moment.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`rounded-xl border p-4 transition-all ${alert.acknowledged
                                    ? 'border-border bg-card/50 opacity-60'
                                    : alert.type === 'out_of_stock'
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : alert.type === 'critical'
                                            ? 'border-amber-500/30 bg-amber-500/5'
                                            : 'border-yellow-500/20 bg-yellow-500/5'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${alert.type === 'out_of_stock' ? 'bg-red-500/20' :
                                        alert.type === 'critical' ? 'bg-amber-500/20' : 'bg-yellow-500/20'
                                    }`}>
                                    {alert.type === 'out_of_stock' ? (
                                        <X className="w-4 h-4 text-red-400" />
                                    ) : (
                                        <AlertTriangle className={`w-4 h-4 ${alert.type === 'critical' ? 'text-amber-400' : 'text-yellow-400'}`} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-foreground">{alert.productName}</span>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${alert.type === 'out_of_stock' ? 'bg-red-500/20 text-red-400' :
                                                alert.type === 'critical' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {alert.type.replace('_', ' ')}
                                        </span>
                                        {alert.notificationSent && (
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Mail className="w-3 h-3" /> Email sent
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {alert.timestamp.toLocaleTimeString()} • {alert.timestamp.toLocaleDateString()}
                                    </p>
                                </div>
                                {!alert.acknowledged && (
                                    <button
                                        onClick={() => handleAcknowledge(alert.id)}
                                        className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors flex-shrink-0"
                                    >
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Footer */}
            {alerts.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                    <span>
                        {alerts.filter(a => a.type === 'out_of_stock').length} out of stock •
                        {alerts.filter(a => a.type === 'critical').length} critical •
                        {alerts.filter(a => a.type === 'low').length} low stock
                    </span>
                    {emailNotifications && (
                        <span className="flex items-center gap-1 text-xs">
                            <BellRing className="w-3 h-3" /> Email notifications active
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};