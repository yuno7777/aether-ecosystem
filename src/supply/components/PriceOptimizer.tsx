// @ts-nocheck
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Sparkles, Loader2, Check, X, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { ProductAnalytics } from '../types';
import { PriceSuggestion, generatePriceSuggestions, getAIPricingInsights, calculateTotalImpact } from '../services/pricingService';

interface PriceOptimizerProps {
    analytics: ProductAnalytics[];
}

const getChangeStyles = (change: number) => {
    if (change > 0) {
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', icon: ArrowUp };
    } else if (change < 0) {
        return { text: 'text-red-400', bg: 'bg-red-500/10', icon: ArrowDown };
    }
    return { text: 'text-muted-foreground', bg: 'bg-muted', icon: Minus };
};

const getConfidenceStyles = (confidence: PriceSuggestion['confidence']) => {
    switch (confidence) {
        case 'high':
            return 'bg-purple-500/10 text-purple-400 border-purple-900/50';
        case 'medium':
            return 'bg-amber-500/10 text-amber-400 border-amber-900/50';
        case 'low':
            return 'bg-slate-500/10 text-slate-400 border-slate-700/50';
    }
};

export const PriceOptimizer: React.FC<PriceOptimizerProps> = ({ analytics }) => {
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
    const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

    const suggestions = useMemo(() => generatePriceSuggestions(analytics), [analytics]);
    const impact = useMemo(() => calculateTotalImpact(suggestions), [suggestions]);

    useEffect(() => {
        const fetchInsight = async () => {
            if (suggestions.length > 0 && !aiInsight) {
                setIsLoading(true);
                const insight = await getAIPricingInsights(suggestions);
                setAiInsight(insight);
                setIsLoading(false);
            }
        };
        fetchInsight();
    }, [suggestions, aiInsight]);

    const handleAccept = (id: string) => {
        setAcceptedIds(prev => new Set([...prev, id]));
        setRejectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handleReject = (id: string) => {
        setRejectedIds(prev => new Set([...prev, id]));
        setAcceptedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    Price Optimizer <DollarSign className="w-6 h-6 text-purple-400" />
                </h1>
                <p className="text-muted-foreground mt-1">AI-powered pricing recommendations based on demand and inventory levels.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Suggestions</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{suggestions.length}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-400/80">Price Increases</p>
                            <p className="text-2xl font-bold text-purple-400 mt-1">{impact.increases}</p>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-400/80">Price Decreases</p>
                            <p className="text-2xl font-bold text-red-400 mt-1">{impact.decreases}</p>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-400/80">Accepted</p>
                            <p className="text-2xl font-bold text-purple-400 mt-1">{acceptedIds.size}</p>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <Check className="w-5 h-5 text-purple-400" />
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
                            <p className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-1">AI Pricing Strategy</p>
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Analyzing pricing opportunities...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Suggestions Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Pricing Recommendations</h3>
                    <p className="text-sm text-muted-foreground">Review and accept/reject AI-generated price suggestions</p>
                </div>

                {suggestions.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>All products are optimally priced</p>
                        <p className="text-sm mt-1">No adjustments needed based on current data</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border bg-muted/30">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Current</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Change</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {suggestions.map(suggestion => {
                                    const styles = getChangeStyles(suggestion.priceChange);
                                    const Icon = styles.icon;
                                    const isAccepted = acceptedIds.has(suggestion.productId);
                                    const isRejected = rejectedIds.has(suggestion.productId);

                                    return (
                                        <tr
                                            key={suggestion.productId}
                                            className={`transition-colors ${isAccepted ? 'bg-purple-950/20' : isRejected ? 'bg-red-950/10 opacity-50' : 'hover:bg-muted/30'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-foreground">{suggestion.productName}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {suggestion.factors.slice(0, 2).map((f, i) => (
                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-muted-foreground">${suggestion.currentPrice.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${styles.bg}`}>
                                                    <Icon className={`w-3 h-3 ${styles.text}`} />
                                                    <span className={`text-sm font-medium ${styles.text}`}>
                                                        {suggestion.priceChange > 0 ? '+' : ''}{suggestion.priceChange.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-foreground">${suggestion.suggestedPrice.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-muted-foreground max-w-xs">{suggestion.reason}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-[10px] font-medium uppercase rounded border ${getConfidenceStyles(suggestion.confidence)}`}>
                                                    {suggestion.confidence}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isAccepted ? (
                                                        <span className="text-xs text-purple-400 font-medium">Accepted</span>
                                                    ) : isRejected ? (
                                                        <span className="text-xs text-red-400 font-medium">Rejected</span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleAccept(suggestion.productId)}
                                                                className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors"
                                                                title="Accept"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(suggestion.productId)}
                                                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
