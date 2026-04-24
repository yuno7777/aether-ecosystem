// @ts-nocheck
import { generateText } from './aiService';
import { ProductAnalytics, Sale } from "../types";

export interface StockoutPrediction {
    productId: string;
    productName: string;
    currentStock: number;
    avgDailySales: number;
    predictedStockoutDate: Date;
    daysUntilStockout: number;
    confidence: 'high' | 'medium' | 'low';
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
    reorderBy: Date;
    supplierLeadTime: number;
}

const calculateConfidence = (salesCount: number, variance: number): 'high' | 'medium' | 'low' => {
    if (salesCount >= 20 && variance < 0.3) return 'high';
    if (salesCount >= 10) return 'medium';
    return 'low';
};

const calculateVariance = (sales: Sale[], productId: string): number => {
    const productSales = sales.filter(s => s.productId === productId);
    if (productSales.length < 2) return 1;

    const quantities = productSales.map(s => s.quantity);
    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
    return Math.sqrt(variance) / (mean || 1);
};

export const generateStockoutPredictions = (
    analytics: ProductAnalytics[],
    sales: Sale[]
): StockoutPrediction[] => {
    const predictions: StockoutPrediction[] = [];
    const now = new Date();

    analytics.forEach(item => {
        const { product, supplier, averageDailySales, daysStockRemaining } = item;

        if (averageDailySales <= 0.01) return;

        const salesCount = sales.filter(s => s.productId === product.id).length;
        const variance = calculateVariance(sales, product.id);
        const confidence = calculateConfidence(salesCount, variance);

        const daysUntil = Math.max(0, Math.floor(product.stock / averageDailySales));
        const stockoutDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);

        const leadTime = supplier?.leadTimeDays || 7;
        const reorderBy = new Date(stockoutDate.getTime() - leadTime * 24 * 60 * 60 * 1000);

        let riskLevel: StockoutPrediction['riskLevel'];
        if (daysUntil <= leadTime) {
            riskLevel = 'critical';
        } else if (daysUntil <= leadTime * 2) {
            riskLevel = 'high';
        } else if (daysUntil <= 30) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }

        let recommendedAction = '';
        if (riskLevel === 'critical') {
            recommendedAction = `Urgent: Place emergency order immediately. Stock will run out before normal delivery.`;
        } else if (riskLevel === 'high') {
            recommendedAction = `Order within ${Math.max(0, Math.floor((reorderBy.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))} days to avoid stockout.`;
        } else if (riskLevel === 'medium') {
            recommendedAction = `Schedule reorder for ${reorderBy.toLocaleDateString()}.`;
        } else {
            recommendedAction = `Stock levels healthy. Monitor demand trends.`;
        }

        predictions.push({
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            avgDailySales: averageDailySales,
            predictedStockoutDate: stockoutDate,
            daysUntilStockout: daysUntil,
            confidence,
            riskLevel,
            recommendedAction,
            reorderBy,
            supplierLeadTime: leadTime
        });
    });

    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return predictions
        .filter(p => p.daysUntilStockout <= 60)
        .sort((a, b) => {
            const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
            if (riskDiff !== 0) return riskDiff;
            return a.daysUntilStockout - b.daysUntilStockout;
        });
};

export const getAIPredictionInsights = async (predictions: StockoutPrediction[]): Promise<string> => {
    if (predictions.length === 0) {
        return "No stockout risks detected in the next 60 days.";
    }

    const criticalItems = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');

    const prompt = `As a supply chain analyst, provide a 2-sentence summary of these stockout predictions. Focus on financial impact and urgency.

Critical/High Risk Items:
${JSON.stringify(criticalItems.slice(0, 5).map(p => ({
        product: p.productName,
        daysLeft: p.daysUntilStockout,
        dailySales: p.avgDailySales.toFixed(1),
        risk: p.riskLevel
    })), null, 2)}

Total items at risk: ${predictions.length}`;

    try {
        const response = await generateText({
            prompt,
            systemPrompt: "You are a supply chain analyst. Be concise. Do NOT use any markdown formatting like asterisks or bold. Use plain text only."
        });
        return response.replace(/\*+/g, '').trim();
    } catch (error) {
        console.error("Prediction AI error:", error);
        return "AI analysis temporarily unavailable.";
    }
};
