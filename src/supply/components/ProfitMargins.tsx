// @ts-nocheck
"use client";
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Percent } from 'lucide-react';
import { ProductAnalytics } from '../types';

interface ProfitMarginsProps {
    analytics: ProductAnalytics[];
}

interface MarginData {
    productId: string;
    productName: string;
    price: number;
    cost: number;
    margin: number;
    marginPercent: number;
    profitPerUnit: number;
    totalInventoryValue: number;
    totalInventoryCost: number;
    potentialProfit: number;
    stock: number;
}

const getMarginColor = (percent: number): string => {
    if (percent >= 50) return '#10b981'; // emerald
    if (percent >= 35) return '#3b82f6'; // blue
    if (percent >= 20) return '#f59e0b'; // amber
    return '#ef4444'; // red
};

const getMarginLevel = (percent: number): string => {
    if (percent >= 50) return 'Excellent';
    if (percent >= 35) return 'Good';
    if (percent >= 20) return 'Fair';
    return 'Low';
};

export const ProfitMargins: React.FC<ProfitMarginsProps> = ({ analytics }) => {
    const marginData = useMemo(() => {
        return analytics
            .filter(a => a.product.cost !== undefined)
            .map(a => {
                const cost = a.product.cost || a.product.price * 0.6;
                const price = a.product.price;
                const margin = price - cost;
                const marginPercent = (margin / price) * 100;

                return {
                    productId: a.product.id,
                    productName: a.product.name,
                    price,
                    cost,
                    margin,
                    marginPercent,
                    profitPerUnit: margin,
                    totalInventoryValue: a.product.stock * price,
                    totalInventoryCost: a.product.stock * cost,
                    potentialProfit: a.product.stock * margin,
                    stock: a.product.stock
                };
            })
            .sort((a, b) => b.marginPercent - a.marginPercent);
    }, [analytics]);

    const summary = useMemo(() => {
        const totalValue = marginData.reduce((sum, m) => sum + m.totalInventoryValue, 0);
        const totalCost = marginData.reduce((sum, m) => sum + m.totalInventoryCost, 0);
        const totalPotentialProfit = marginData.reduce((sum, m) => sum + m.potentialProfit, 0);
        const avgMargin = marginData.length > 0
            ? marginData.reduce((sum, m) => sum + m.marginPercent, 0) / marginData.length
            : 0;
        const lowMarginProducts = marginData.filter(m => m.marginPercent < 20).length;

        return { totalValue, totalCost, totalPotentialProfit, avgMargin, lowMarginProducts };
    }, [marginData]);

    const chartData = marginData.slice(0, 10).map(m => ({
        name: m.productName.length > 15 ? m.productName.substring(0, 15) + '...' : m.productName,
        price: m.price,
        cost: m.cost,
        margin: Math.round(m.marginPercent),
        profit: m.profitPerUnit
    }));

    const pieData = [
        { name: 'Excellent (50%+)', value: marginData.filter(m => m.marginPercent >= 50).length, color: '#10b981' },
        { name: 'Good (35-50%)', value: marginData.filter(m => m.marginPercent >= 35 && m.marginPercent < 50).length, color: '#3b82f6' },
        { name: 'Fair (20-35%)', value: marginData.filter(m => m.marginPercent >= 20 && m.marginPercent < 35).length, color: '#f59e0b' },
        { name: 'Low (<20%)', value: marginData.filter(m => m.marginPercent < 20).length, color: '#ef4444' }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Percent className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Profit Margin Analysis</h3>
                    <p className="text-sm text-muted-foreground">Cost vs. selling price analytics</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Inventory Value</p>
                    <p className="text-xl font-bold text-foreground">₹{summary.totalValue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Inventory Cost</p>
                    <p className="text-xl font-bold text-muted-foreground">₹{summary.totalCost.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Potential Profit</p>
                    <p className="text-xl font-bold text-purple-400">₹{summary.totalPotentialProfit.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Average Margin</p>
                    <p className="text-xl font-bold text-foreground">{summary.avgMargin.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Low Margin Products</p>
                    <p className="text-xl font-bold text-red-400">{summary.lowMarginProducts}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price vs Cost Bar Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Price vs Cost by Product</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#262626" />
                                <XAxis type="number" stroke="#525252" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                                <YAxis dataKey="name" type="category" stroke="#525252" fontSize={11} width={80} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                    formatter={(value: number, name: string) => [`₹${value}`, name === 'cost' ? 'Cost' : 'Price']}
                                />
                                <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="price" name="Price" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Margin Distribution Pie */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Margin Distribution</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ percent }: any) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                    formatter={(value: number) => [value, 'Products']}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Product Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h4 className="font-semibold text-foreground">Product Margins</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Cost</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Margin</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Margin %</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Potential Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {marginData.map((m) => (
                                <tr key={m.productId} className="hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium text-foreground">{m.productName}</td>
                                    <td className="px-6 py-4 text-right text-foreground">₹{m.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">₹{m.cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-purple-400">₹{m.profitPerUnit.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className="px-2 py-1 text-xs rounded font-medium"
                                            style={{
                                                backgroundColor: `${getMarginColor(m.marginPercent)}20`,
                                                color: getMarginColor(m.marginPercent)
                                            }}
                                        >
                                            {m.marginPercent.toFixed(1)}% • {getMarginLevel(m.marginPercent)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{m.stock}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-medium text-purple-400">₹{m.potentialProfit.toLocaleString()}</span>
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
