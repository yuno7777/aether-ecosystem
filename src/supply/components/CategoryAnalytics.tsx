// @ts-nocheck
"use client";
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Layers, TrendingUp, Package, DollarSign } from 'lucide-react';
import { ProductAnalytics, StockStatus } from '../types';

interface CategoryAnalyticsProps {
    analytics: ProductAnalytics[];
}

interface CategoryData {
    name: string;
    products: number;
    totalStock: number;
    totalValue: number;
    avgDailySales: number;
    criticalItems: number;
    lowItems: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({ analytics }) => {
    const categoryData = useMemo(() => {
        const categories = new Map<string, CategoryData>();

        analytics.forEach(item => {
            const cat = item.product.category;
            const existing = categories.get(cat) || {
                name: cat,
                products: 0,
                totalStock: 0,
                totalValue: 0,
                avgDailySales: 0,
                criticalItems: 0,
                lowItems: 0
            };

            existing.products += 1;
            existing.totalStock += item.product.stock;
            existing.totalValue += item.product.stock * item.product.price;
            existing.avgDailySales += item.averageDailySales;
            if (item.status === StockStatus.CRITICAL) existing.criticalItems += 1;
            if (item.status === StockStatus.LOW) existing.lowItems += 1;

            categories.set(cat, existing);
        });

        return Array.from(categories.values()).sort((a, b) => b.totalValue - a.totalValue);
    }, [analytics]);

    const pieData = categoryData.map((cat, i) => ({
        name: cat.name,
        value: cat.totalValue,
        color: COLORS[i % COLORS.length]
    }));

    const barData = categoryData.map(cat => ({
        name: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
        products: cat.products,
        stock: cat.totalStock,
        sales: Math.round(cat.avgDailySales * 10) / 10
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Category Analytics</h3>
                    <p className="text-sm text-muted-foreground">Performance breakdown by product category</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-foreground">{categoryData.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Top Category</p>
                    <p className="text-lg font-bold text-foreground truncate">{categoryData[0]?.name || '-'}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Top Category Value</p>
                    <p className="text-lg font-bold text-purple-400">₹{categoryData[0]?.totalValue.toLocaleString() || 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Categories at Risk</p>
                    <p className="text-lg font-bold text-red-400">{categoryData.filter(c => c.criticalItems > 0).length}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Value Distribution</h4>
                    <div className="flex items-center gap-8">
                        <div className="h-[240px] w-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={95}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ede9e9ff', borderRadius: '8px', border: '1px solid #262626', color: '#d4d4d4' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                                        labelStyle={{ color: '#a3a3a3' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex flex-col gap-3">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                                    <span className="text-sm font-medium text-foreground ml-auto">₹{entry.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Stock & Sales by Category</h4>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                />
                                <Bar dataKey="stock" name="Total Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="sales" name="Daily Sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Category Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h4 className="font-semibold text-foreground">Category Details</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Products</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Value</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Avg Daily Sales</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">At Risk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categoryData.map((cat, index) => (
                                <tr key={cat.name} className="hover:bg-muted/20">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="font-medium text-foreground">{cat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-muted-foreground">{cat.products}</td>
                                    <td className="px-6 py-4 text-right text-foreground">{cat.totalStock.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-medium text-purple-400">₹{cat.totalValue.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">{cat.avgDailySales.toFixed(1)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {cat.criticalItems > 0 ? (
                                            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">{cat.criticalItems} critical</span>
                                        ) : cat.lowItems > 0 ? (
                                            <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded">{cat.lowItems} low</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">Healthy</span>
                                        )}
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
