// @ts-nocheck
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Bell, X, Sparkles, Loader2 } from 'lucide-react';
import { ProductAnalytics, Sale } from '../types';
import { Anomaly, detectAnomalies, analyzeAnomaliesWithAI } from '../services/anomalyService';

interface AnomalyDetectionProps {
    analytics: ProductAnalytics[];
    sales: Sale[];
}

const getSeverityStyles = (severity: Anomaly['severity']) => {
    switch (severity) {
        case 'critical':
            return {
                bg: 'bg-red-950/30',
                border: 'border-red-900/50',
                icon: 'bg-red-500/20 text-red-400',
                badge: 'bg-red-500/20 text-red-400 border-red-900/50'
            };
        case 'warning':
            return {
                bg: 'bg-amber-950/30',
                border: 'border-amber-900/50',
                icon: 'bg-amber-500/20 text-amber-400',
                badge: 'bg-amber-500/20 text-amber-400 border-amber-900/50'
            };
        case 'info':
            return {
                bg: 'bg-blue-950/30',
                border: 'border-blue-900/50',
                icon: 'bg-blue-500/20 text-blue-400',
                badge: 'bg-blue-500/20 text-blue-400 border-blue-900/50'
            };
    }
};

const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
        case 'demand_spike':
            return TrendingUp;
        case 'demand_drop':
            return TrendingDown;
        default:
            return Activity;
    }
};

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({ analytics, sales }) => {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const anomalies = useMemo(() => detectAnomalies(analytics, sales), [analytics, sales]);

    const visibleAnomalies = useMemo(() =>
        anomalies.filter(a => !dismissedIds.has(a.id)),
        [anomalies, dismissedIds]
    );

    const criticalCount = visibleAnomalies.filter(a => a.severity === 'critical').length;
    const warningCount = visibleAnomalies.filter(a => a.severity === 'warning').length;

    useEffect(() => {
        const analyze = async () => {
            if (anomalies.length > 0 && !aiSummary) {
                setIsAnalyzing(true);
                const summary = await analyzeAnomaliesWithAI(anomalies, analytics);
                setAiSummary(summary);
                setIsAnalyzing(false);
            }
        };
        analyze();
    }, [anomalies, analytics, aiSummary]);

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    if (visibleAnomalies.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Bell className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Anomaly Detection</h3>
                        <p className="text-sm text-muted-foreground">AI-powered pattern monitoring</p>
                    </div>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No anomalies detected. Inventory patterns are normal.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-red-900/10 to-amber-900/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Anomaly Detection</h3>
                            <p className="text-sm text-muted-foreground">
                                {visibleAnomalies.length} alert{visibleAnomalies.length !== 1 ? 's' : ''} requiring attention
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {criticalCount > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-900/50">
                                {criticalCount} Critical
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-900/50">
                                {warningCount} Warning
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Summary */}
            {(aiSummary || isAnalyzing) && (
                <div className="px-6 py-4 border-b border-border bg-purple-900/10">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg shrink-0">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-1">AI Analysis</p>
                            {isAnalyzing ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Analyzing patterns...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts List */}
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {visibleAnomalies.map(anomaly => {
                    const styles = getSeverityStyles(anomaly.severity);
                    const Icon = getTypeIcon(anomaly.type);

                    return (
                        <div
                            key={anomaly.id}
                            className={`px-6 py-4 ${styles.bg} transition-colors hover:bg-opacity-50`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg shrink-0 ${styles.icon}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-foreground text-sm">{anomaly.title}</h4>
                                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${styles.badge} uppercase`}>
                                            {anomaly.severity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted-foreground">
                                            <span className="text-foreground font-medium">{anomaly.metric}</span>
                                        </span>
                                        {anomaly.change !== 0 && (
                                            <span className={anomaly.change > 0 ? 'text-purple-400' : 'text-red-400'}>
                                                {anomaly.change > 0 ? '+' : ''}{Math.round(anomaly.change)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDismiss(anomaly.id)}
                                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground shrink-0"
                                    title="Dismiss"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
