// @ts-nocheck
import { generateText } from './aiService';
import { ProductAnalytics, DemandTrend, StockStatus } from "../types";

export interface PriceSuggestion {
    productId: string;
    productName: string;
    currentPrice: number;
    suggestedPrice: number;
    priceChange: number;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    projectedRevenue: number;
    projectedRevenueChange: number;
    factors: string[];
}

const calculatePriceSuggestion = (item: ProductAnalytics): PriceSuggestion | null => {
    const { product, demandTrend, status, averageDailySales, daysStockRemaining } = item;

    let priceMultiplier = 1;
    let reason = '';
    let factors: string[] = [];
    let confidence: PriceSuggestion['confidence'] = 'medium';

    if (demandTrend === DemandTrend.INCREASING && (status === StockStatus.LOW || status === StockStatus.CRITICAL)) {
        priceMultiplier = 1.15;
        reason = 'High demand with limited stock - premium pricing opportunity';
        factors = ['Demand increasing', 'Stock critically low', 'Supply constraint'];
        confidence = 'high';
    }
    else if (demandTrend === DemandTrend.INCREASING && status === StockStatus.NORMAL) {
        priceMultiplier = 1.08;
        reason = 'Strong demand supports price optimization';
        factors = ['Demand trending up', 'Healthy margins possible'];
        confidence = 'medium';
    }
    else if (demandTrend === DemandTrend.DECLINING && status === StockStatus.OVERSTOCKED) {
        priceMultiplier = 0.85;
        reason = 'Clearance pricing to reduce excess inventory';
        factors = ['Declining demand', 'Excess inventory', 'Storage cost reduction'];
        confidence = 'high';
    }
    else if (status === StockStatus.OVERSTOCKED) {
        priceMultiplier = 0.92;
        reason = 'Slight discount to accelerate inventory turnover';
        factors = ['Excess stock', 'Improve cash flow'];
        confidence = 'medium';
    }
    else if (averageDailySales < 0.1 && product.stock > 0) {
        priceMultiplier = 0.70;
        reason = 'Aggressive pricing to move stagnant inventory';
        factors = ['No recent sales', 'Potential dead stock', 'Recover capital'];
        confidence = 'low';
    }
    else {
        return null;
    }

    const suggestedPrice = Math.round(product.price * priceMultiplier * 100) / 100;
    const priceChange = ((suggestedPrice - product.price) / product.price) * 100;

    const currentDailyRevenue = averageDailySales * product.price;
    const demandMultiplier = priceChange < 0 ? 1 + (Math.abs(priceChange) * 0.005) : 1 - (priceChange * 0.003);
    const projectedDailyRevenue = (averageDailySales * demandMultiplier) * suggestedPrice;

    const projectedRevenue = projectedDailyRevenue * 30;
    const projectedRevenueChange = ((projectedDailyRevenue - currentDailyRevenue) / currentDailyRevenue) * 100;

    return {
        productId: product.id,
        productName: product.name,
        currentPrice: product.price,
        suggestedPrice,
        priceChange,
        reason,
        confidence,
        projectedRevenue,
        projectedRevenueChange: isNaN(projectedRevenueChange) ? 0 : projectedRevenueChange,
        factors
    };
};

export const generatePriceSuggestions = (analytics: ProductAnalytics[]): PriceSuggestion[] => {
    const suggestions: PriceSuggestion[] = [];

    analytics.forEach(item => {
        const suggestion = calculatePriceSuggestion(item);
        if (suggestion) {
            suggestions.push(suggestion);
        }
    });

    return suggestions.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));
};

export const getAIPricingInsights = async (suggestions: PriceSuggestion[]): Promise<string> => {
    if (suggestions.length === 0) {
        return "All products are optimally priced based on current demand and stock levels.";
    }

    const prompt = `As a pricing strategist, provide a 2-sentence executive summary of these pricing optimization opportunities. Focus on potential revenue impact.

Opportunities:
${JSON.stringify(suggestions.slice(0, 5).map(s => ({
        product: s.productName,
        currentPrice: s.currentPrice,
        suggestedPrice: s.suggestedPrice,
        change: s.priceChange.toFixed(1) + '%',
        reason: s.reason
    })), null, 2)}

Total opportunities: ${suggestions.length} products`;

    try {
        const response = await generateText({
            prompt,
            systemPrompt: "You are a pricing strategist. Be concise. Do NOT use any markdown formatting like asterisks or bold. Use plain text only."
        });
        return response.replace(/\*+/g, '').trim();
    } catch (error) {
        console.error("Pricing AI error:", error);
        return "AI analysis temporarily unavailable.";
    }
};

export const calculateTotalImpact = (suggestions: PriceSuggestion[]): {
    increases: number;
    decreases: number;
    revenue: number
} => {
    const increases = suggestions.filter(s => s.priceChange > 0).length;
    const decreases = suggestions.filter(s => s.priceChange < 0).length;
    const revenue = suggestions.reduce((sum, s) => sum + (s.projectedRevenue - (s.currentPrice * 30)), 0);

    return { increases, decreases, revenue };
};
