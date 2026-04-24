// @ts-nocheck
import { generateText } from './aiService';
import { ProductAnalytics, Sale } from "../types";

export interface Anomaly {
    id: string;
    productId: string;
    productName: string;
    type: 'demand_spike' | 'demand_drop' | 'unusual_pattern' | 'seasonal';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    metric: string;
    change: number;
    detectedAt: Date;
}

const calculateVelocityChange = (sales: Sale[], productId: string): { recent: number; previous: number; change: number } => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const productSales = sales.filter(s => s.productId === productId);

    const recentSales = productSales.filter(s => new Date(s.date) >= sevenDaysAgo);
    const previousSales = productSales.filter(s => {
        const date = new Date(s.date);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });

    const recentQty = recentSales.reduce((sum, s) => sum + s.quantity, 0);
    const previousQty = previousSales.reduce((sum, s) => sum + s.quantity, 0);

    const change = previousQty > 0
        ? ((recentQty - previousQty) / previousQty) * 100
        : recentQty > 0 ? 100 : 0;

    return { recent: recentQty, previous: previousQty, change };
};

export const detectAnomalies = (analytics: ProductAnalytics[], sales: Sale[]): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    analytics.forEach(item => {
        const velocity = calculateVelocityChange(sales, item.product.id);

        if (velocity.change > 50 && velocity.recent > 3) {
            anomalies.push({
                id: `anomaly-spike-${item.product.id}`,
                productId: item.product.id,
                productName: item.product.name,
                type: 'demand_spike',
                severity: velocity.change > 100 ? 'critical' : 'warning',
                title: `Demand Spike Detected`,
                description: `${item.product.name} sales increased by ${Math.round(velocity.change)}% in the last 7 days. Current stock may not meet demand.`,
                metric: `${velocity.recent} units (vs ${velocity.previous} previous week)`,
                change: velocity.change,
                detectedAt: new Date()
            });
        }

        if (velocity.change < -40 && velocity.previous > 3) {
            anomalies.push({
                id: `anomaly-drop-${item.product.id}`,
                productId: item.product.id,
                productName: item.product.name,
                type: 'demand_drop',
                severity: 'warning',
                title: `Demand Decline Alert`,
                description: `${item.product.name} sales dropped by ${Math.abs(Math.round(velocity.change))}%. Consider promotional activities or inventory review.`,
                metric: `${velocity.recent} units (vs ${velocity.previous} previous week)`,
                change: velocity.change,
                detectedAt: new Date()
            });
        }

        if (item.status === 'Critical' && item.averageDailySales > 0.5) {
            anomalies.push({
                id: `anomaly-stockout-${item.product.id}`,
                productId: item.product.id,
                productName: item.product.name,
                type: 'unusual_pattern',
                severity: 'critical',
                title: `Imminent Stockout Risk`,
                description: `${item.product.name} has critical stock (${item.product.stock} units) with active demand of ${item.averageDailySales.toFixed(1)} units/day.`,
                metric: `${item.daysStockRemaining} days remaining`,
                change: 0,
                detectedAt: new Date()
            });
        }

        if (item.status === 'Overstocked' && item.demandTrend === 'Declining') {
            anomalies.push({
                id: `anomaly-overstock-${item.product.id}`,
                productId: item.product.id,
                productName: item.product.name,
                type: 'unusual_pattern',
                severity: 'info',
                title: `Overstock with Declining Demand`,
                description: `${item.product.name} is overstocked (${item.product.stock} units) while demand is declining. Consider clearance or promotions.`,
                metric: `${item.daysStockRemaining}+ days of inventory`,
                change: 0,
                detectedAt: new Date()
            });
        }
    });

    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};

export const analyzeAnomaliesWithAI = async (anomalies: Anomaly[], analytics: ProductAnalytics[]): Promise<string> => {
    if (anomalies.length === 0) {
        return "No anomalies detected. Your inventory patterns are stable.";
    }

    const prompt = `Analyze these inventory anomalies and provide a brief 2-3 sentence executive summary focusing on the most critical issues and recommended immediate actions.

Anomalies detected:
${JSON.stringify(anomalies.slice(0, 5).map(a => ({
        product: a.productName,
        type: a.type,
        severity: a.severity,
        description: a.description
    })), null, 2)}

Be concise and actionable.`;

    try {
        const response = await generateText({
            prompt,
            systemPrompt: "You are a supply chain analyst. Be concise and actionable. Do NOT use any markdown formatting like asterisks, bold, or headers. Use plain text only."
        });
        // Strip any remaining asterisks from the response
        return response.replace(/\*+/g, '').trim();
    } catch (error) {
        console.error("Anomaly AI analysis error:", error);
        return "AI analysis temporarily unavailable.";
    }
};
