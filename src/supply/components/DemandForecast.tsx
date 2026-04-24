// @ts-nocheck
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus, Loader2, Sparkles, BarChart3, Package, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProductAnalytics, Sale } from '../types';
import { calculateLocalForecast, generateAIDemandForecast, fetchMLForecasts, DemandForecastResult } from '../services/forecastService';

interface DemandForecastProps {
    analytics: ProductAnalytics[];
    sales: Sale[];
}

export const DemandForecast: React.FC<DemandForecastProps> = ({ analytics, sales }) => {
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [selectedView, setSelectedView] = useState<'cards' | 'chart'>('cards');
    
    const [forecasts, setForecasts] = useState<DemandForecastResult[]>([]);
    const [forecastsLoading, setForecastsLoading] = useState(true);

    // Calculate forecasts using ML models, fallback to local math if ML fails
    useEffect(() => {
        const loadForecasts = async () => {
            setForecastsLoading(true);
            try {
                const mlForecasts = await fetchMLForecasts(analytics, sales);
                if (mlForecasts && mlForecasts.length > 0) {
                    setForecasts(mlForecasts);
                } else {
                    setForecasts(calculateLocalForecast(analytics, sales));
                }
            } catch (err) {
                console.error("Failed to load ML forecasts, falling back to local math", err);
                setForecasts(calculateLocalForecast(analytics, sales));
            } finally {
                setForecastsLoading(false);
            }
        };
        
        if (analytics.length > 0) {
            loadForecasts();
        } else {
            setForecasts([]);
            setForecastsLoading(false);
        }
    }, [analytics, sales]);

    // Chart data
    const chartData = useMemo(() => {
        return forecasts.slice(0, 10).map(f => ({
            name: f.productName.length > 15 ? f.productName.substring(0, 15) + '...' : f.productName,
            current: f.currentDailyDemand,
            predicted: f.predictedDailyDemand,
            growth: f.growthPercent
        }));
    }, [forecasts]);

    // Summary stats
    const stats = useMemo(() => {
        const growing = forecasts.filter(f => f.trend === 'growing');
        const declining = forecasts.filter(f => f.trend === 'declining');
        const totalPredicted = forecasts.reduce((s, f) => s + f.predictedDailyDemand, 0);
        const highConfidence = forecasts.filter(f => f.confidence === 'high');

        return {
            totalProducts: forecasts.length,
            growing: growing.length,
            declining: declining.length,
            stable: forecasts.length - growing.length - declining.length,
            totalPredictedDaily: totalPredicted.toFixed(1),
            highConfidence: highConfidence.length,
            topGrower: growing.sort((a, b) => b.growthPercent - a.growthPercent)[0],
            topDecliner: declining.sort((a, b) => a.growthPercent - b.growthPercent)[0]
        };
    }, [forecasts]);

    const handleAIForecast = async () => {
        setAiLoading(true);
        try {
            const insight = await generateAIDemandForecast(analytics, sales);
            setAiInsight(insight);
        } catch (error) {
            setAiInsight('Failed to generate AI forecast. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'growing': return <TrendingUp className="w-4 h-4 text-purple-400" />;
            case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
            default: return <Minus className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'growing': return 'text-purple-400';
            case 'declining': return 'text-red-400';
            default: return 'text-muted-foreground';
        }
    };

    const getConfidenceBadge = (confidence: string) => {
        switch (confidence) {
            case 'high': return <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">HIGH</span>;
            case 'medium': return <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">MED</span>;
            case 'low': return <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400 border border-red-500/30">LOW</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">AI Demand Forecasting</h3>
                        <p className="text-sm text-muted-foreground">Predict future demand using sales history and AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-border overflow-hidden">
                        <button
                            onClick={() => setSelectedView('cards')}
                            className={`px-3 py-1.5 text-xs ${selectedView === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
                        >
                            <Package className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setSelectedView('chart')}
                            className={`px-3 py-1.5 text-xs border-l border-border ${selectedView === 'chart' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {forecastsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Running ML Models...</h3>
                    <p className="text-sm text-muted-foreground">Fetching demand forecasts from XGBoost backend</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">Products Analyzed</p>
                            <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">Growing Demand</p>
                            <p className="text-2xl font-bold text-purple-400">{stats.growing}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">Declining Demand</p>
                            <p className="text-2xl font-bold text-red-400">{stats.declining}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground">Predicted Daily Units</p>
                            <p className="text-2xl font-bold text-purple-400">{stats.totalPredictedDaily}</p>
                        </div>
                    </div>

                    {/* AI Insight Section */}
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <h4 className="font-semibold text-foreground text-sm">AI Strategic Analysis</h4>
                            </div>
                            <button
                                onClick={handleAIForecast}
                                disabled={aiLoading}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {aiLoading ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                                ) : (
                                    <><RefreshCw className="w-3 h-3" /> Generate Forecast</>
                                )}
                            </button>
                        </div>
                        {aiInsight ? (
                            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{aiInsight}</div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Click "Generate Forecast" to get AI-powered demand analysis and strategic recommendations.</p>
                        )}
                    </div>

                    {/* Demand Comparison Chart */}
                    {selectedView === 'chart' && chartData.length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h4 className="font-semibold text-foreground mb-4">Current vs Predicted Daily Demand</h4>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                                        <XAxis dataKey="name" stroke="#525252" fontSize={11} angle={-20} textAnchor="end" height={60} />
                                        <YAxis stroke="#525252" fontSize={11} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626' }}
                                            formatter={(value: number) => [value.toFixed(2) + ' units/day', '']}
                                        />
                                        <Legend />
                                        <Bar dataKey="current" name="Current Demand" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="predicted" name="Predicted Demand" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Product Forecast Cards */}
                    {selectedView === 'cards' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {forecasts.map((forecast) => (
                                <div key={forecast.productId} className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h5 className="font-medium text-foreground text-sm">{forecast.productName}</h5>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getTrendIcon(forecast.trend)}
                                                <span className={`text-xs font-medium ${getTrendColor(forecast.trend)}`}>
                                                    {forecast.trend === 'growing' ? '+' : ''}{forecast.growthPercent}%
                                                </span>
                                                {getConfidenceBadge(forecast.confidence)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Current Demand</span>
                                            <span className="font-mono text-foreground">{forecast.currentDailyDemand} units/day</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Predicted Demand</span>
                                            <span className={`font-mono font-medium ${getTrendColor(forecast.trend)}`}>
                                                {forecast.predictedDailyDemand} units/day
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Recommended Stock</span>
                                            <span className="font-mono text-foreground">{forecast.recommendedStock} units</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs text-muted-foreground">{forecast.insight}</p>
                                    </div>
                                </div>
                            ))}
                            {forecasts.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                                    <p>Not enough sales data to generate forecasts. Add more sales records first.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Key Insights */}
                    {(stats.topGrower || stats.topDecliner) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.topGrower && (
                                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-purple-400" />
                                        <h5 className="text-sm font-semibold text-foreground">Fastest Growing</h5>
                                    </div>
                                    <p className="text-sm font-medium text-purple-400">{stats.topGrower.productName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">+{stats.topGrower.growthPercent}% demand growth • Recommended stock: {stats.topGrower.recommendedStock}</p>
                                </div>
                            )}
                            {stats.topDecliner && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                        <h5 className="text-sm font-semibold text-foreground">Fastest Declining</h5>
                                    </div>
                                    <p className="text-sm font-medium text-red-400">{stats.topDecliner.productName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{stats.topDecliner.growthPercent}% demand drop • Consider reducing orders</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
