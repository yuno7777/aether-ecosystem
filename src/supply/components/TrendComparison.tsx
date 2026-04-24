// @ts-nocheck
"use client";
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight, Calendar, Minus } from 'lucide-react';
import { ProductAnalytics, Sale } from '../types';

interface TrendComparisonProps {
    analytics: ProductAnalytics[];
    sales: Sale[];
}

type Period = '7d' | '14d' | '30d';

interface ComparisonData {
    metric: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    icon: 'up' | 'down' | 'neutral';
}

const filterSalesByPeriod = (sales: Sale[], daysAgo: number, daysRange: number): Sale[] => {
    const now = new Date();
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() - (daysAgo - daysRange) * 24 * 60 * 60 * 1000);

    return sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= startDate && saleDate < endDate;
    });
};

export const TrendComparison: React.FC<TrendComparisonProps> = ({ analytics, sales }) => {
    const [period, setPeriod] = useState<Period>('7d');

    const periodDays = period === '7d' ? 7 : period === '14d' ? 14 : 30;

    const comparisonData = useMemo(() => {
        const currentSales = filterSalesByPeriod(sales, 0, periodDays);
        const previousSales = filterSalesByPeriod(sales, periodDays, periodDays);

        const currentUnits = currentSales.reduce((sum, s) => sum + s.quantity, 0);
        const previousUnits = previousSales.reduce((sum, s) => sum + s.quantity, 0);

        const currentRevenue = currentSales.reduce((sum, s) => {
            const product = analytics.find(a => a.product.id === s.productId);
            return sum + (s.quantity * (product?.product.price || 0));
        }, 0);
        const previousRevenue = previousSales.reduce((sum, s) => {
            const product = analytics.find(a => a.product.id === s.productId);
            return sum + (s.quantity * (product?.product.price || 0));
        }, 0);

        const currentOrders = currentSales.length;
        const previousOrders = previousSales.length;

        const currentAvgOrder = currentOrders > 0 ? currentUnits / currentOrders : 0;
        const previousAvgOrder = previousOrders > 0 ? previousUnits / previousOrders : 0;

        const calculateChange = (current: number, previous: number): { change: number; percent: number; icon: 'up' | 'down' | 'neutral' } => {
            const change = current - previous;
            const percent = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;
            const icon = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
            return { change, percent, icon };
        };

        const metrics: ComparisonData[] = [
            {
                metric: 'Total Units Sold',
                current: currentUnits,
                previous: previousUnits,
                ...(() => { const c = calculateChange(currentUnits, previousUnits); return { change: c.change, changePercent: c.percent, icon: c.icon }; })()
            },
            {
                metric: 'Revenue',
                current: currentRevenue,
                previous: previousRevenue,
                ...(() => { const c = calculateChange(currentRevenue, previousRevenue); return { change: c.change, changePercent: c.percent, icon: c.icon }; })()
            },
            {
                metric: 'Total Orders',
                current: currentOrders,
                previous: previousOrders,
                ...(() => { const c = calculateChange(currentOrders, previousOrders); return { change: c.change, changePercent: c.percent, icon: c.icon }; })()
            },
            {
                metric: 'Avg Units/Order',
                current: currentAvgOrder,
                previous: previousAvgOrder,
                ...(() => { const c = calculateChange(currentAvgOrder, previousAvgOrder); return { change: c.change, changePercent: c.percent, icon: c.icon }; })()
            }
        ];

        return metrics;
    }, [analytics, sales, periodDays]);

    const productComparison = useMemo(() => {
        const currentSales = filterSalesByPeriod(sales, 0, periodDays);
        const previousSales = filterSalesByPeriod(sales, periodDays, periodDays);

        return analytics.slice(0, 8).map(a => {
            const currentQty = currentSales.filter(s => s.productId === a.product.id).reduce((sum, s) => sum + s.quantity, 0);
            const previousQty = previousSales.filter(s => s.productId === a.product.id).reduce((sum, s) => sum + s.quantity, 0);

            return {
                name: a.product.name.length > 12 ? a.product.name.substring(0, 12) + '...' : a.product.name,
                current: currentQty,
                previous: previousQty,
                change: currentQty - previousQty
            };
        }).filter(p => p.current > 0 || p.previous > 0);
    }, [analytics, sales, periodDays]);

    const dailyTrend = useMemo(() => {
        const days: { day: string; current: number; previous: number }[] = [];

        for (let i = periodDays - 1; i >= 0; i--) {
            const currentDay = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const previousDay = new Date(Date.now() - (i + periodDays) * 24 * 60 * 60 * 1000);

            const currentDaySales = sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.toDateString() === currentDay.toDateString();
            }).reduce((sum, s) => sum + s.quantity, 0);

            const previousDaySales = sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.toDateString() === previousDay.toDateString();
            }).reduce((sum, s) => sum + s.quantity, 0);

            days.push({
                day: currentDay.toLocaleDateString('en', { weekday: 'short' }),
                current: currentDaySales,
                previous: previousDaySales
            });
        }

        return days;
    }, [sales, periodDays]);

    const periodLabels: Record<Period, { current: string; previous: string }> = {
        '7d': { current: 'This Week', previous: 'Last Week' },
        '14d': { current: 'Last 14 Days', previous: 'Prior 14 Days' },
        '30d': { current: 'This Month', previous: 'Last Month' }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Trend Comparison</h3>
                        <p className="text-sm text-muted-foreground">{periodLabels[period].current} vs {periodLabels[period].previous}</p>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    {(['7d', '14d', '30d'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === p
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : '30 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {comparisonData.map((data) => (
                    <div key={data.metric} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground mb-2">{data.metric}</p>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {data.metric === 'Revenue' ? `₹${data.current.toLocaleString()}` : data.current.toFixed(data.metric.includes('Avg') ? 1 : 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    vs {data.metric === 'Revenue' ? `₹${data.previous.toLocaleString()}` : data.previous.toFixed(data.metric.includes('Avg') ? 1 : 0)}
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${data.icon === 'up' ? 'bg-purple-500/20 text-purple-400' :
                                data.icon === 'down' ? 'bg-red-500/20 text-red-400' :
                                    'bg-neutral-500/20 text-neutral-400'
                                }`}>
                                {data.icon === 'up' && <TrendingUp className="w-3 h-3" />}
                                {data.icon === 'down' && <TrendingDown className="w-3 h-3" />}
                                {data.icon === 'neutral' && <Minus className="w-3 h-3" />}
                                {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Trend Line Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Daily Sales Comparison</h4>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                <XAxis dataKey="day" stroke="#525252" fontSize={11} />
                                <YAxis stroke="#525252" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                />
                                <Line type="monotone" dataKey="current" name={periodLabels[period].current} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="previous" name={periodLabels[period].previous} stroke="#525252" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                                <Legend iconType="circle" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Product Comparison Bar Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h4 className="font-semibold text-foreground mb-4">Product Performance</h4>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productComparison} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                <XAxis dataKey="name" stroke="#525252" fontSize={10} angle={-45} textAnchor="end" height={60} />
                                <YAxis stroke="#525252" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                />
                                <Bar dataKey="previous" name={periodLabels[period].previous} fill="#525252" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="current" name={periodLabels[period].current} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Legend iconType="circle" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
