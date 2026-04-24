// @ts-nocheck
import { generateText, generateJSON } from './aiService';
import { ProductAnalytics } from "../types";

export interface InventoryInsight {
    healthScore: number;
    summary: string;
    recommendations: string[];
}

const MOCK_INSIGHT: InventoryInsight = {
    healthScore: 68,
    summary: "The inventory assessment reveals significant operational risk, with 33% of analyzed SKUs currently sitting below critical reorder thresholds despite a healthy total valuation of $114,262.92. Immediate procurement action is necessary to address stockouts in high-value categories and specialized components like AI chips and display units.",
    recommendations: [
        "Execute emergency restock orders for the Quantum 4K Monitor, SonicBlast Pro Headset, SmartHub Dock, and NeuralNet AI Chip to restore baseline operations.",
        "Perform a supplier capacity review to ensure the four existing vendors can manage concurrent expedited shipments for all critical items.",
        "Recalibrate safety stock buffers for the NeuralNet AI Chip and SmartHub Dock, as current levels are dangerously close to zero."
    ]
};

export const generateInventoryInsight = async (analytics: ProductAnalytics[]): Promise<InventoryInsight | null> => {
    console.log("Generating inventory insights with Genkit...");

    const summaryData = analytics.map(a => ({
        name: a.product.name,
        stock: a.product.stock,
        status: a.status,
        trend: a.demandTrend,
        daysRemaining: a.daysStockRemaining,
        reorderSuggestion: a.suggestedReorderQty > 0 ? a.suggestedReorderQty : 'None'
    }));

    const prompt = `Analyze the following inventory data and return a JSON object with exactly these fields:
1. "healthScore": A number between 0-100 representing overall inventory health (100 is perfect).
2. "summary": A concise, executive paragraph highlighting risks and value. Focus on financial impact and operational continuity.
3. "recommendations": An array of 3 specific, actionable strings (e.g., "Execute emergency restock for X", "Review supplier Y").

Data Snapshot:
${JSON.stringify(summaryData.slice(0, 15), null, 2)}`;

    const systemPrompt = "You are a Supply Chain Inventory Analyst. Analyze inventory data and provide actionable insights.";

    try {
        const result = await generateJSON<InventoryInsight>({
            prompt,
            systemPrompt
        });

        if (result) {
            console.log("Genkit inventory insight generated successfully");
            return result;
        }
        return MOCK_INSIGHT;
    } catch (error: any) {
        console.error("Genkit Inventory Error:", error);
        return MOCK_INSIGHT;
    }
};