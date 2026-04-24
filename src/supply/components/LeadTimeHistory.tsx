// @ts-nocheck
"use client";
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Supplier, SupplierDelivery, Product } from '../types';

interface LeadTimeHistoryProps {
    suppliers: Supplier[];
    deliveries: SupplierDelivery[];
    products: Product[];
}

const getDaysDiff = (date1: string, date2: string): number => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

export const LeadTimeHistory: React.FC<LeadTimeHistoryProps> = ({ suppliers, deliveries, products }) => {
    const deliveryData = useMemo(() => {
        return deliveries
            .filter(d => d.status === 'delivered' && d.actualDate)
            .map(d => {
                const supplier = suppliers.find(s => s.id === d.supplierId);
                const product = products.find(p => p.id === d.productId);
                const promisedDays = getDaysDiff(d.orderedDate, d.promisedDate);
                const actualDays = getDaysDiff(d.orderedDate, d.actualDate);
                const variance = actualDays - promisedDays;

                return {
                    id: d.id,
                    supplier: supplier?.name || 'Unknown',
                    product: product?.name || 'Unknown',
                    orderedDate: d.orderedDate,
                    promisedDays,
                    actualDays,
                    variance,
                    status: variance <= 0 ? 'early' : variance <= 2 ? 'slight-delay' : 'delayed'
                };
            })
            .sort((a, b) => new Date(a.orderedDate).getTime() - new Date(b.orderedDate).getTime());
    }, [deliveries, suppliers, products]);

    const supplierStats = useMemo(() => {
        const stats: Record<string, { promised: number[]; actual: number[] }> = {};

        deliveryData.forEach(d => {
            if (!stats[d.supplier]) {
                stats[d.supplier] = { promised: [], actual: [] };
            }
            stats[d.supplier].promised.push(d.promisedDays);
            stats[d.supplier].actual.push(d.actualDays);
        });

        return Object.entries(stats).map(([name, data]) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            avgPromised: Math.round(data.promised.reduce((a, b) => a + b, 0) / data.promised.length),
            avgActual: Math.round(data.actual.reduce((a, b) => a + b, 0) / data.actual.length)
        }));
    }, [deliveryData]);

    const summary = useMemo(() => {
        const onTime = deliveryData.filter(d => d.variance <= 0).length;
        const slightDelay = deliveryData.filter(d => d.variance > 0 && d.variance <= 2).length;
        const delayed = deliveryData.filter(d => d.variance > 2).length;
        const avgVariance = deliveryData.length > 0
            ? deliveryData.reduce((sum, d) => sum + d.variance, 0) / deliveryData.length
            : 0;

        return { onTime, slightDelay, delayed, avgVariance, total: deliveryData.length };
    }, [deliveryData]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Lead Time History</h3>
                    <p className="text-sm text-muted-foreground">Track actual vs. promised delivery times</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                        <p className="text-xs text-muted-foreground">On-Time / Early</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-400">{summary.onTime}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <p className="text-xs text-muted-foreground">Slight Delay (1-2 days)</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{summary.slightDelay}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <p className="text-xs text-muted-foreground">Delayed (3+ days)</p>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{summary.delayed}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground mb-2">Avg Variance</p>
                    <p className={`text-2xl font-bold ${summary.avgVariance <= 0 ? 'text-purple-400' : summary.avgVariance <= 1 ? 'text-amber-400' : 'text-red-400'}`}>
                        {summary.avgVariance >= 0 ? '+' : ''}{summary.avgVariance.toFixed(1)} days
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="font-semibold text-foreground mb-4">Promised vs Actual Lead Time by Supplier</h4>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={supplierStats} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                            <XAxis dataKey="name" stroke="#525252" fontSize={11} />
                            <YAxis stroke="#525252" fontSize={11} label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fill: '#525252' } }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                formatter={(value: number, name: string) => [`${value} days`, name === 'avgPromised' ? 'Avg Promised' : 'Avg Actual']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="avgPromised" name="Avg Promised" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="avgActual" name="Avg Actual" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Delivery Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h4 className="font-semibold text-foreground">Recent Deliveries</h4>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/30 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Supplier</th>
                                <th className="px-4 py-3 text-left text-xs text-muted-foreground">Product</th>
                                <th className="px-4 py-3 text-center text-xs text-muted-foreground">Promised</th>
                                <th className="px-4 py-3 text-center text-xs text-muted-foreground">Actual</th>
                                <th className="px-4 py-3 text-center text-xs text-muted-foreground">Variance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {deliveryData.map(d => (
                                <tr key={d.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3 text-foreground">{d.supplier}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{d.product.substring(0, 25)}{d.product.length > 25 ? '...' : ''}</td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">{d.promisedDays}d</td>
                                    <td className="px-4 py-3 text-center text-foreground">{d.actualDays}d</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded font-medium ${d.variance <= 0 ? 'bg-purple-500/20 text-purple-400' :
                                            d.variance <= 2 ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {d.variance <= 0 ? d.variance : `+${d.variance}`}d
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
