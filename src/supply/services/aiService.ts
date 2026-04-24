// @ts-nocheck
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const MODEL = 'gemini-2.5-flash';

export interface GenerateOptions {
    prompt: string;
    systemPrompt?: string;
}

export const generateText = async (options: GenerateOptions): Promise<string> => {
    const { prompt, systemPrompt } = options;

    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: fullPrompt
        });

        return response.text || "Unable to generate response.";
    } catch (error: any) {
        if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('QUOTA_EXCEEDED');
        }
        throw error;
    }
};

export const generateJSON = async <T>(options: GenerateOptions): Promise<T | null> => {
    const { prompt, systemPrompt } = options;

    if (!apiKey) return null;

    const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\nRespond ONLY with valid JSON, no markdown or explanation.\n\n${prompt}`
        : `Respond ONLY with valid JSON, no markdown or explanation.\n\n${prompt}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: fullPrompt
        });

        const text = response.text;
        if (text) {
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText) as T;
        }
        return null;
    } catch (error: any) {
        if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('QUOTA_EXCEEDED');
        }
        throw error;
    }
};

export { ai, MODEL };
