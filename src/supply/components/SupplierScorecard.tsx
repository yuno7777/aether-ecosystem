// @ts-nocheck
"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Star, TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { Supplier, SupplierDelivery } from '../types';

interface SupplierScorecardProps {
    suppliers: Supplier[];
    deliveries: SupplierDelivery[];
}

const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#f59e0b';
    return '#ef4444';
};

const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            );
        } else if (i === fullStars && hasHalf) {
            stars.push(
                <Star key={i} className="w-4 h-4 fill-amber-400/50 text-amber-400" />
            );
        } else {
            stars.push(
                <Star key={i} className="w-4 h-4 text-muted-foreground/30" />
            );
        }
    }
    return stars;
};

export const SupplierScorecard: React.FC<SupplierScorecardProps> = ({ suppliers, deliveries }) => {
    if (suppliers.length === 0) {
        return <div className="text-center text-muted-foreground py-12">No suppliers available.</div>;
    }

    const chartData = suppliers.map(s => ({
        name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
        fullName: s.name,
        onTime: s.onTimePercent || 0,
        fulfillment: s.fulfillmentRate || 0,
        rating: s.rating || 0
    }));

    // Find best performers
    const bestOnTime = suppliers.reduce((prev, curr) =>
        (prev.onTimePercent || 0) > (curr.onTimePercent || 0) ? prev : curr
    );
    const bestRated = suppliers.reduce((prev, curr) =>
        (prev.rating || 0) > (curr.rating || 0) ? prev : curr
    );

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Suppliers</p>
                    <p className="text-2xl font-bold text-foreground">{suppliers.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold text-amber-400">
                        {(suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Best On-Time</p>
                    <p className="text-lg font-bold text-purple-400 truncate">{bestOnTime.name}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Top Rated</p>
                    <p className="text-lg font-bold text-blue-400 truncate">{bestRated.name}</p>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="font-semibold text-foreground mb-4">Supplier Performance Comparison</h4>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#525252" fontSize={11} />
                            <YAxis stroke="#525252" fontSize={11} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                formatter={(value: number, name: string) => [`${value}%`, name === 'onTime' ? 'On-Time %' : 'Fulfillment %']}
                            />
                            <Bar dataKey="onTime" name="On-Time %" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="fulfillment" name="Fulfillment %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map(supplier => (
                    <div key={supplier.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="font-semibold text-foreground">{supplier.name}</h4>
                                <p className="text-xs text-muted-foreground">{supplier.location}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {renderStars(supplier.rating || 0)}
                                <span className="text-sm font-medium text-foreground ml-1">{supplier.rating}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-lg font-bold text-foreground">{supplier.onTimePercent}%</p>
                                <p className="text-[10px] text-muted-foreground">On-Time</p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <CheckCircle className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-lg font-bold text-foreground">{supplier.fulfillmentRate}%</p>
                                <p className="text-[10px] text-muted-foreground">Fulfilled</p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <Package className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-lg font-bold text-foreground">{supplier.totalOrders}</p>
                                <p className="text-[10px] text-muted-foreground">Orders</p>
                            </div>
                        </div>

                        {/* Performance Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Overall Score</span>
                                <span>{Math.round(((supplier.onTimePercent || 0) + (supplier.fulfillmentRate || 0) + (supplier.rating || 0) * 20) / 3)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${((supplier.onTimePercent || 0) + (supplier.fulfillmentRate || 0) + (supplier.rating || 0) * 20) / 3}%`,
                                        backgroundColor: getRatingColor(supplier.rating || 0)
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
