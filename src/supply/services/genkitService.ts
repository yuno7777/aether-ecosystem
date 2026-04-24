// @ts-nocheck
import { GoogleGenAI } from "@google/genai";

// Get API key from environment (Vite uses import.meta.env)
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

console.log("AI Service: API Key status:", apiKey ? `Loaded (${apiKey.substring(0, 8)}...)` : "Missing");

// Initialize Google GenAI
const ai = new GoogleGenAI({ apiKey });

// Model configuration - using gemini-3.1-flash-lite-preview as requested
const MODEL = 'gemini-3.1-flash-lite-preview';

export interface GenerateOptions {
    prompt: string;
    systemPrompt?: string;
}

/**
 * Generate text using Gemini model
 */
export const generateText = async (options: GenerateOptions): Promise<string> => {
    const { prompt, systemPrompt } = options;

    if (!apiKey) {
        console.warn("AI Service: No API key available");
        throw new Error('API_KEY_MISSING');
    }

    try {
        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\n${prompt}`
            : prompt;

        console.log(`AI Service: Calling ${MODEL}...`);

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: fullPrompt
        });

        console.log("AI Service: Response received successfully");
        return response.text || "Unable to generate response.";
    } catch (error: any) {
        console.error("AI Service Error:", error);

        // Check for quota errors
        if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('QUOTA_EXCEEDED');
        }

        throw error;
    }
};

/**
 * Generate JSON response
 */
export const generateJSON = async <T>(options: GenerateOptions): Promise<T | null> => {
    const { prompt, systemPrompt } = options;

    if (!apiKey) {
        console.warn("AI Service: No API key available");
        return null;
    }

    try {
        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\nRespond ONLY with valid JSON, no markdown or explanation.\n\n${prompt}`
            : `Respond ONLY with valid JSON, no markdown or explanation.\n\n${prompt}`;

        console.log(`AI Service: Calling ${MODEL} for JSON...`);

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: fullPrompt
        });

        const text = response.text;
        if (text) {
            // Clean up potential markdown code blocks
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText) as T;
        }
        return null;
    } catch (error: any) {
        console.error("AI JSON Error:", error);

        if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('QUOTA_EXCEEDED');
        }

        throw error;
    }
};

export { ai, MODEL };
