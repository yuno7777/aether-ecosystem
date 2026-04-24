// @ts-nocheck
"use client";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, TrendingDown, Package, Clock, CheckCircle, X, ChevronRight, Filter, Box } from 'lucide-react';
import { ProductAnalytics, StockStatus, Supplier } from '../types';

interface SupplierAlertsProps {
  analytics: ProductAnalytics[];
  suppliers: Supplier[];
}

type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertType = 'stockout' | 'low-stock' | 'delivery-delay' | 'reorder';

interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  productName: string;
  supplierName?: string;
  timestamp: Date;
  dismissed: boolean;
}

const priorityConfig: Record<AlertPriority, { color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
  high: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: TrendingDown },
  medium: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Package },
  low: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Clock },
};

const typeLabels: Record<AlertType, string> = {
  stockout: 'Stock Out',
  'low-stock': 'Low Stock',
  'delivery-delay': 'Delay Risk',
  reorder: 'Reorder Due',
};

export const SupplierAlerts: React.FC<SupplierAlertsProps> = ({ analytics, suppliers }) => {
  const [filter, setFilter] = useState<AlertPriority | 'all'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const alerts: Alert[] = useMemo(() => {
    const generated: Alert[] = [];

    analytics.forEach(a => {
      const supplier = suppliers.find(s => s.id === a.product.supplierId);
      const supplierName = supplier?.name || 'Unknown';

      if (a.status === StockStatus.CRITICAL || a.product.stock === 0) {
        generated.push({
          id: `stockout-${a.product.id}`,
          type: 'stockout',
          priority: 'critical',
          title: `${a.product.name} is critically low`,
          message: `Only ${a.product.stock} units remaining. Reorder level is ${a.product.reorderLevel}. Immediate action required to prevent stockout.`,
          productName: a.product.name,
          supplierName,
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          dismissed: false,
        });
      } else if (a.status === StockStatus.LOW) {
        generated.push({
          id: `lowstock-${a.product.id}`,
          type: 'low-stock',
          priority: 'high',
          title: `${a.product.name} stock is below reorder level`,
          message: `Current stock: ${a.product.stock}/${a.product.reorderLevel}. Consider placing a reorder with ${supplierName}.`,
          productName: a.product.name,
          supplierName,
          timestamp: new Date(Date.now() - Math.random() * 172800000),
          dismissed: false,
        });
      }

      // Simulated delivery delay risk
      if (supplier && supplier.deliveryReliability < 85 && a.product.stock < a.product.reorderLevel * 1.5) {
        generated.push({
          id: `delay-${a.product.id}`,
          type: 'delivery-delay',
          priority: 'medium',
          title: `Delivery risk for ${a.product.name}`,
          message: `${supplierName} has ${supplier.deliveryReliability}% delivery reliability. With current stock at ${a.product.stock}, consider alternate sourcing.`,
          productName: a.product.name,
          supplierName,
          timestamp: new Date(Date.now() - Math.random() * 259200000),
          dismissed: false,
        });
      }

      // Reorder suggestions
      if (a.daysOfStock !== undefined && a.daysOfStock < 14 && a.daysOfStock > 0) {
        generated.push({
          id: `reorder-${a.product.id}`,
          type: 'reorder',
          priority: 'low',
          title: `Reorder ${a.product.name} within ${Math.ceil(a.daysOfStock)} days`,
          message: `Estimated ${Math.ceil(a.daysOfStock)} days of stock remaining at current velocity. Plan a reorder with ${supplierName}.`,
          productName: a.product.name,
          supplierName,
          timestamp: new Date(Date.now() - Math.random() * 345600000),
          dismissed: false,
        });
      }
    });

    return generated.sort((a, b) => {
      const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return pOrder[a.priority] - pOrder[b.priority] || b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [analytics, suppliers]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(a => !dismissedIds.has(a.id))
      .filter(a => filter === 'all' || a.priority === filter);
  }, [alerts, dismissedIds, filter]);

  const dismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    if (expandedId === id) setExpandedId(null);
  };

  const dismissAll = () => {
    setDismissedIds(new Set(alerts.map(a => a.id)));
    setExpandedId(null);
  };

  const stats = useMemo(() => ({
    total: alerts.filter(a => !dismissedIds.has(a.id)).length,
    critical: alerts.filter(a => a.priority === 'critical' && !dismissedIds.has(a.id)).length,
    high: alerts.filter(a => a.priority === 'high' && !dismissedIds.has(a.id)).length,
    medium: alerts.filter(a => a.priority === 'medium' && !dismissedIds.has(a.id)).length,
    low: alerts.filter(a => a.priority === 'low' && !dismissedIds.has(a.id)).length,
  }), [alerts, dismissedIds]);

  const formatTime = (d: Date) => {
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    return `${Math.round(diff / 86400000)}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            {stats.total > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {stats.total > 99 ? '99+' : stats.total}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supplier Alerts</h1>
            <p className="text-sm text-muted-foreground">{stats.total} active alerts across your supply chain</p>
          </div>
        </div>
        {stats.total > 0 && (
          <button
            onClick={dismissAll}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-white bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
          >
            Dismiss All
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, filterKey: 'all' as const, color: 'text-foreground', bg: 'bg-muted/30', border: 'border-border' },
          { label: 'Critical', value: stats.critical, filterKey: 'critical' as const, ...priorityConfig.critical },
          { label: 'High', value: stats.high, filterKey: 'high' as const, ...priorityConfig.high },
          { label: 'Medium', value: stats.medium, filterKey: 'medium' as const, ...priorityConfig.medium },
          { label: 'Low', value: stats.low, filterKey: 'low' as const, ...priorityConfig.low },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => setFilter(stat.filterKey)}
            className={`p-4 rounded-xl border text-left transition-all ${
              filter === stat.filterKey
                ? `${stat.bg} ${stat.border} ring-1 ring-offset-0 ring-current`
                : 'bg-card border-border hover:border-white/15'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {filter === 'all' ? 'All Alerts' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts`}
          </p>
          <span className="text-xs text-muted-foreground">{filteredAlerts.length} results</span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-10 h-10 text-purple-500/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">All clear — no active alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {filteredAlerts.map(alert => {
                const config = priorityConfig[alert.priority];
                const Icon = config.icon;
                const isExpanded = expandedId === alert.id;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-6 py-4 transition-colors hover:bg-muted/20 ${isExpanded ? 'bg-muted/10' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${config.bg} shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${config.bg} ${config.color} border ${config.border}`}>
                              {alert.priority}
                            </span>
                            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-muted/50 text-muted-foreground">
                              {typeLabels[alert.type]}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(alert.timestamp)}</span>
                          </div>

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                            className="text-left w-full"
                          >
                            <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{alert.message}</p>
                                {alert.supplierName && (
                                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                    <Box className="w-3 h-3" />
                                    Supplier: <span className="text-foreground font-medium">{alert.supplierName}</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                            className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          <button
                            onClick={() => dismiss(alert.id)}
                            className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
