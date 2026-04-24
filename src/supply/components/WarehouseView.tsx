// @ts-nocheck
"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { MapPin, Package, Warehouse as WarehouseIcon, TrendingUp } from 'lucide-react';
import { ProductAnalytics, Warehouse, StockStatus } from '../types';

const Warehouse3D = dynamic(() => import('./Warehouse3D').then(mod => ({ default: mod.Warehouse3D })), { ssr: false });

interface WarehouseViewProps {
    analytics: ProductAnalytics[];
    warehouses: Warehouse[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

export const WarehouseView: React.FC<WarehouseViewProps> = ({ analytics, warehouses }) => {
    const warehouseData = useMemo(() => {
        return warehouses.map((warehouse, index) => {
            const products = analytics.filter(a => a.product.warehouseId === warehouse.id);
            const totalStock = products.reduce((sum, a) => sum + a.product.stock, 0);
            const totalValue = products.reduce((sum, a) => sum + (a.product.stock * a.product.price), 0);
            const criticalCount = products.filter(a => a.status === StockStatus.CRITICAL).length;
            const lowCount = products.filter(a => a.status === StockStatus.LOW).length;
            const utilizationPercent = (totalStock / warehouse.capacity) * 100;

            return {
                ...warehouse,
                productCount: products.length,
                totalStock,
                totalValue,
                criticalCount,
                lowCount,
                utilizationPercent,
                color: COLORS[index % COLORS.length],
                products
            };
        });
    }, [analytics, warehouses]);

    const unassigned = useMemo(() => {
        return analytics.filter(a => !a.product.warehouseId);
    }, [analytics]);

    const pieData = warehouseData.map(w => ({
        name: w.name,
        value: w.totalValue,
        color: w.color
    }));

    const barData = warehouseData.map(w => ({
        name: w.name.length > 12 ? w.name.substring(0, 12) + '...' : w.name,
        stock: w.totalStock,
        capacity: w.capacity,
        utilization: Math.round(w.utilizationPercent)
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <WarehouseIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Warehouse Locations</h3>
                    <p className="text-sm text-muted-foreground">Multi-location inventory tracking</p>
                </div>
            </div>

            {/* 3D Warehouse Visualization */}
            <div className="rounded-2xl border border-border bg-card p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <h4 className="text-sm font-medium text-foreground">3D Layout</h4>
                    <span className="text-[10px] text-muted-foreground ml-auto">Drag to rotate · Scroll to zoom</span>
                </div>
                <Warehouse3D warehouses={warehouses} analytics={analytics} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Locations</p>
                    <p className="text-2xl font-bold text-foreground">{warehouses.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Capacity</p>
                    <p className="text-2xl font-bold text-foreground">{warehouses.reduce((s, w) => s + w.capacity, 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Stock</p>
                    <p className="text-2xl font-bold text-cyan-400">{warehouseData.reduce((s, w) => s + w.totalStock, 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Unassigned Products</p>
                    <p className="text-2xl font-bold text-amber-400">{unassigned.length}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Value Distribution */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Inventory Value by Location</h4>
                    <div className="flex items-center gap-8">
                        <div className="h-[200px] w-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#c1a2d7ff', borderRadius: '8px', border: '1px solid #262626', color: '#d4d4d4' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Value']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-2">
                            {warehouseData.map((w, i) => (
                                <div key={w.id} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                                    <span className="text-sm text-muted-foreground">{w.name}</span>
                                    <span className="text-sm font-medium text-foreground ml-auto">₹{w.totalValue.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Capacity Utilization */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Capacity Utilization</h4>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                <XAxis dataKey="name" stroke="#525252" fontSize={11} />
                                <YAxis stroke="#525252" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                />
                                <Bar dataKey="stock" name="Current Stock" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="capacity" name="Capacity" fill="#262626" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Warehouse Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {warehouseData.map(warehouse => (
                    <div key={warehouse.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: warehouse.color }} />
                                    <h4 className="font-semibold text-foreground">{warehouse.name}</h4>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {warehouse.location}
                                </div>
                            </div>
                            <div className={`px-2 py-1 text-xs rounded font-medium ${warehouse.utilizationPercent > 80 ? 'bg-red-500/20 text-red-400' :
                                warehouse.utilizationPercent > 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                {warehouse.utilizationPercent.toFixed(0)}% full
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Products</span>
                                <span className="text-foreground font-medium">{warehouse.productCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Units</span>
                                <span className="text-foreground font-medium">{warehouse.totalStock.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Value</span>
                                <span className="text-purple-400 font-medium">₹{warehouse.totalValue.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Capacity</span>
                                <span>{warehouse.totalStock} / {warehouse.capacity}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${warehouse.utilizationPercent > 80 ? 'bg-red-400' :
                                        warehouse.utilizationPercent > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                                        }`}
                                    style={{ width: `${Math.min(warehouse.utilizationPercent, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Alerts */}
                        {(warehouse.criticalCount > 0 || warehouse.lowCount > 0) && (
                            <div className="mt-3 pt-3 border-t border-border flex gap-2">
                                {warehouse.criticalCount > 0 && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{warehouse.criticalCount} critical</span>
                                )}
                                {warehouse.lowCount > 0 && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{warehouse.lowCount} low</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
