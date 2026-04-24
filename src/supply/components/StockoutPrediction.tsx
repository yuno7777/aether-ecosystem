// @ts-nocheck
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertCircle, Calendar, Truck, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { ProductAnalytics, Sale } from '../types';
import { StockoutPrediction, generateStockoutPredictions, getAIPredictionInsights } from '../services/predictionService';

interface StockoutPredictionProps {
    analytics: ProductAnalytics[];
    sales: Sale[];
}

const getRiskStyles = (risk: StockoutPrediction['riskLevel']) => {
    switch (risk) {
        case 'critical':
            return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-900/50', badge: 'bg-red-500/20' };
        case 'high':
            return { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-900/50', badge: 'bg-orange-500/20' };
        case 'medium':
            return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-900/50', badge: 'bg-amber-500/20' };
        case 'low':
            return { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-900/50', badge: 'bg-purple-500/20' };
    }
};

const getConfidenceBadge = (confidence: StockoutPrediction['confidence']) => {
    switch (confidence) {
        case 'high':
            return 'bg-purple-500/10 text-purple-400 border-purple-900/50';
        case 'medium':
            return 'bg-amber-500/10 text-amber-400 border-amber-900/50';
        case 'low':
            return 'bg-slate-500/10 text-slate-400 border-slate-700/50';
    }
};

export const StockoutPredictionView: React.FC<StockoutPredictionProps> = ({ analytics, sales }) => {
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');

    const predictions = useMemo(() => generateStockoutPredictions(analytics, sales), [analytics, sales]);

    const filteredPredictions = useMemo(() => {
        if (filter === 'all') return predictions;
        if (filter === 'critical') return predictions.filter(p => p.riskLevel === 'critical');
        if (filter === 'high') return predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
        return predictions;
    }, [predictions, filter]);

    useEffect(() => {
        const fetchInsight = async () => {
            if (predictions.length > 0 && !aiInsight) {
                setIsLoading(true);
                const insight = await getAIPredictionInsights(predictions);
                setAiInsight(insight);
                setIsLoading(false);
            }
        };
        fetchInsight();
    }, [predictions, aiInsight]);

    const criticalCount = predictions.filter(p => p.riskLevel === 'critical').length;
    const highCount = predictions.filter(p => p.riskLevel === 'high').length;

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Predictions</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{predictions.length}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-400/80">Critical Risk</p>
                            <p className="text-2xl font-bold text-red-400 mt-1">{criticalCount}</p>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-orange-900/30 bg-orange-950/20 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-400/80">High Risk</p>
                            <p className="text-2xl font-bold text-orange-400 mt-1">{highCount}</p>
                        </div>
                        <div className="p-3 bg-orange-500/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Insight */}
            {(aiInsight || isLoading) && (
                <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-1">AI Prediction Analysis</p>
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Analyzing stockout risks...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'high', 'critical'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filter === f
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {f === 'all' ? 'All' : f === 'high' ? 'High & Critical' : 'Critical Only'}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Stockout Timeline</h3>
                    <p className="text-sm text-muted-foreground">Predicted stockout dates for the next 60 days</p>
                </div>

                {filteredPredictions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No stockout risks in this category</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredPredictions.map(prediction => {
                            const styles = getRiskStyles(prediction.riskLevel);

                            return (
                                <div key={prediction.productId} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {/* Timeline indicator */}
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-3 h-3 rounded-full ${styles.bg}`} />
                                            <div className="w-0.5 h-8 bg-border" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-foreground truncate">{prediction.productName}</h4>
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${styles.badge} ${styles.text}`}>
                                                    {prediction.riskLevel}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getConfidenceBadge(prediction.confidence)}`}>
                                                    {prediction.confidence} confidence
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{prediction.recommendedAction}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span className={styles.text}>{prediction.daysUntilStockout} days</span> until stockout
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {prediction.predictedStockoutDate.toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Truck className="w-3 h-3" />
                                                    {prediction.supplierLeadTime}d lead time
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stock info */}
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-bold text-foreground">{prediction.currentStock}</p>
                                            <p className="text-xs text-muted-foreground">units left</p>
                                        </div>

                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
