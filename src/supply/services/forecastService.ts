// @ts-nocheck
import { generateText } from './aiService';
import { ProductAnalytics, Sale } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_SUPPLY_API_URL || 'http://localhost:8000/api/supply';

export interface DemandForecastResult {
    productId: string;
    productName: string;
    currentDailyDemand: number;
    predictedDailyDemand: number;
    confidence: 'high' | 'medium' | 'low';
    trend: 'growing' | 'stable' | 'declining';
    growthPercent: number;
    recommendedStock: number;
    seasonalFactor: string;
    insight: string;
}

// Fetch AI/ML forecast from the unified FastAPI backend
export const fetchMLForecasts = async (
    analytics: ProductAnalytics[],
    sales: Sale[]
): Promise<DemandForecastResult[]> => {
    const forecasts: DemandForecastResult[] = [];
    
    // Sort by average daily sales and limit to top 15 products to avoid overloading the backend
    const topProducts = [...analytics]
        .sort((a, b) => b.averageDailySales - a.averageDailySales)
        .slice(0, 15);

    // Call backend in parallel batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < topProducts.length; i += BATCH_SIZE) {
        const batch = topProducts.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (item) => {
            try {
                const res = await fetch(`${API_BASE}/forecast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        product_id: item.product.id, 
                        days_ahead: 30
                    })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const avgDaily = data.total_predicted / 30;
                    
                    let trend: DemandForecastResult['trend'] = 'stable';
                    let growthRate = 0;
                    
                    if (item.averageDailySales > 0) {
                        growthRate = ((avgDaily - item.averageDailySales) / item.averageDailySales) * 100;
                        if (growthRate > 5) trend = 'growing';
                        else if (growthRate < -5) trend = 'declining';
                    } else if (avgDaily > 0) {
                        trend = 'growing';
                        growthRate = 100;
                    }
                    
                    forecasts.push({
                        productId: item.product.id,
                        productName: item.product.name,
                        currentDailyDemand: parseFloat(item.averageDailySales.toFixed(2)),
                        predictedDailyDemand: parseFloat(Math.max(0, avgDaily).toFixed(2)),
                        confidence: data.confidence || 'medium',
                        trend,
                        growthPercent: parseFloat(growthRate.toFixed(1)),
                        recommendedStock: data.recommended_reorder,
                        seasonalFactor: 'Normal',
                        insight: data.message || `XGBoost ML Model Forecast: ${data.total_predicted.toFixed(0)} total demand over next 30 days.`
                    });
                } else {
                    console.error(`Backend returned ${res.status} for ${item.product.name}`);
                }
            } catch (error) {
                console.error(`Failed to fetch ML forecast for ${item.product.name}:`, error);
            }
        }));
    }
    
    return forecasts.sort((a, b) => Math.abs(b.growthPercent) - Math.abs(a.growthPercent));
};

// Local math-based forecast (fallback)
export const calculateLocalForecast = (
    analytics: ProductAnalytics[],
    sales: Sale[]
): DemandForecastResult[] => {
    return analytics
        .filter(a => a.averageDailySales > 0.01)
        .map(item => {
            const { product, averageDailySales, demandTrend, supplier } = item;

            // Calculate recent vs older sales trend
            const productSales = sales
                .filter(s => s.productId === product.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let recentAvg = averageDailySales;
            let olderAvg = averageDailySales;

            if (productSales.length >= 4) {
                const mid = Math.floor(productSales.length / 2);
                const recent = productSales.slice(0, mid);
                const older = productSales.slice(mid);

                const recentDays = Math.max(1, (new Date(recent[0].date).getTime() - new Date(recent[recent.length - 1].date).getTime()) / (1000 * 60 * 60 * 24));
                const olderDays = Math.max(1, (new Date(older[0].date).getTime() - new Date(older[older.length - 1].date).getTime()) / (1000 * 60 * 60 * 24));

                recentAvg = recent.reduce((s, sale) => s + sale.quantity, 0) / recentDays;
                olderAvg = older.reduce((s, sale) => s + sale.quantity, 0) / olderDays;
            }

            const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
            const predictedDemand = recentAvg * (1 + (growthRate / 100) * 0.5); // dampened projection

            let trend: DemandForecastResult['trend'] = 'stable';
            if (growthRate > 10) trend = 'growing';
            else if (growthRate < -10) trend = 'declining';

            let confidence: DemandForecastResult['confidence'] = 'medium';
            if (productSales.length >= 20) confidence = 'high';
            else if (productSales.length < 5) confidence = 'low';

            const leadTime = supplier?.leadTimeDays || 7;
            const safetyBuffer = 1.5;
            const recommendedStock = Math.ceil(predictedDemand * (leadTime + 7) * safetyBuffer);

            return {
                productId: product.id,
                productName: product.name,
                currentDailyDemand: parseFloat(averageDailySales.toFixed(2)),
                predictedDailyDemand: parseFloat(Math.max(0.01, predictedDemand).toFixed(2)),
                confidence,
                trend,
                growthPercent: parseFloat(growthRate.toFixed(1)),
                recommendedStock,
                seasonalFactor: 'Normal',
                insight: trend === 'growing'
                    ? `Demand is growing ${Math.abs(growthRate).toFixed(0)}%. Consider increasing stock.`
                    : trend === 'declining'
                        ? `Demand declining ${Math.abs(growthRate).toFixed(0)}%. Reduce reorder quantities.`
                        : `Demand is stable. Maintain current stock levels.`
            };
        })
        .sort((a, b) => Math.abs(b.growthPercent) - Math.abs(a.growthPercent));
};

// AI-powered forecast using Gemini
export const generateAIDemandForecast = async (
    analytics: ProductAnalytics[],
    sales: Sale[]
): Promise<string> => {
    const localForecast = calculateLocalForecast(analytics, sales);

    const topProducts = localForecast.slice(0, 8).map(f => ({
        name: f.productName,
        currentDemand: f.currentDailyDemand,
        predictedDemand: f.predictedDailyDemand,
        trend: f.trend,
        growth: f.growthPercent + '%',
        recommendedStock: f.recommendedStock
    }));

    const prompt = `As a demand planning expert, analyze these inventory demand forecasts and provide strategic recommendations.

FORECAST DATA:
${JSON.stringify(topProducts, null, 2)}

Total products: ${analytics.length}
Products with growing demand: ${localForecast.filter(f => f.trend === 'growing').length}
Products with declining demand: ${localForecast.filter(f => f.trend === 'declining').length}

Provide:
1. Executive summary (2 sentences)
2. Top 3 actionable recommendations
3. Risk assessment for growing demand products
4. Suggested adjustments for declining products

Keep the response concise and actionable. Do NOT use markdown bold formatting (**text**). Use plain text with emojis for readability.`;

    try {
        const response = await generateText({
            prompt,
            systemPrompt: "You are a demand forecasting analyst for an inventory management system. Be data-driven and actionable. Do NOT use markdown formatting. Use plain text only with emojis for visual cues."
        });
        return response.replace(/\*+/g, '').trim();
    } catch (error) {
        console.error('AI Forecast Error:', error);
        return "AI analysis temporarily unavailable. Review the mathematical forecasts below for insights.";
    }
};
