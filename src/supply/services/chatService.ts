// @ts-nocheck
import { generateText } from './aiService';
import { ProductAnalytics, Sale, Supplier, Product } from "../types";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    action?: ExecutedAction;
}

export interface ChatContext {
    analytics: ProductAnalytics[];
    sales: Sale[];
    suppliers: Supplier[];
}

export interface CRUDCallbacks {
    addProduct?: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct?: (product: Product) => Promise<void>;
    deleteProduct?: (productId: string) => Promise<void>;
}

export interface ExecutedAction {
    type: 'add_product' | 'update_stock' | 'update_price' | 'delete_product' | 'reorder_flag';
    status: 'success' | 'error';
    detail: string;
}

// ACTION marker the AI must embed when it wants to perform a CRUD operation.
// Format: ACTION_JSON:{"type":"...","data":{...}}:END_ACTION
const ACTION_START = 'ACTION_JSON:';
const ACTION_END = ':END_ACTION';

const SYSTEM_PROMPT = `You are an AI assistant for Aether Supply, an inventory management system powered by Google GenAI.
You help users understand their inventory data AND can perform inventory operations when asked.

You have access to real-time inventory data provided with each query. When answering:
1. Be concise and actionable
2. Use specific numbers and product names from the data
3. Highlight critical issues (low stock, stockouts)
4. Suggest next steps when relevant
5. Use bullet points and emojis for readability
6. Do NOT use markdown bold formatting (**text**) — use plain text with emojis

CRUD OPERATIONS:
When the user asks you to ADD, UPDATE, or DELETE inventory items, you MUST embed an action block at the very end of your response using this exact format:
ACTION_JSON:{"type":"ACTION_TYPE","data":{...}}:END_ACTION

Supported action types:
- add_product: Add a new product. data = {name, sku, category, price, stock, reorderLevel, cost}
- update_stock: Update stock level. data = {productId, productName, newStock}
- update_price: Update product price. data = {productId, productName, newPrice}
- delete_product: Delete a product. data = {productId, productName}
- reorder_flag: Mark for reorder (informational). data = {productName, suggestedQty}

Examples:
User: "Add 50 units of Wireless Mouse to stock" → embed ACTION_JSON:{"type":"update_stock","data":{"productId":"<id>","productName":"Wireless Mouse","newStock":50}}:END_ACTION
User: "Create a new product NeuralNet Chip priced at 4500, 20 in stock" → embed ACTION_JSON:{"type":"add_product","data":{"name":"NeuralNet Chip","sku":"NNC-001","category":"Electronics","price":4500,"stock":20,"reorderLevel":5,"cost":3200}}:END_ACTION

If the user asks about something not in the data, politely explain what information is available.
If a CRUD action cannot be completed due to missing info, ask the user for the missing details.`;

const formatInventoryContext = (context: ChatContext): string => {
    const { analytics, sales, suppliers } = context;

    const inventorySummary = analytics.map(a => ({
        id: a.product.id,
        name: a.product.name,
        category: a.product.category,
        stock: a.product.stock,
        price: a.product.price,
        cost: a.product.cost,
        reorderLevel: a.product.reorderLevel,
        status: a.status,
        trend: a.demandTrend,
        daysRemaining: a.daysStockRemaining,
        avgDailySales: a.averageDailySales.toFixed(1),
        reorderSuggestion: a.suggestedReorderQty,
        supplier: a.supplier?.name || 'Unknown'
    }));

    const recentSales = sales.slice(0, 20).map(s => {
        const product = analytics.find(a => a.product.id === s.productId);
        return {
            product: product?.product.name || s.productId,
            quantity: s.quantity,
            date: new Date(s.date).toLocaleDateString()
        };
    });

    return `
CURRENT INVENTORY DATA (includes product IDs needed for CRUD actions):
${JSON.stringify(inventorySummary, null, 2)}

RECENT SALES (Last 20):
${JSON.stringify(recentSales, null, 2)}

SUPPLIERS:
${JSON.stringify(suppliers.map(s => ({ name: s.name, leadTime: s.leadTimeDays + ' days' })), null, 2)}
`;
};

// Parse and strip any ACTION_JSON block from the AI's text response
const parseAction = (text: string): { cleanText: string; actionPayload: any | null } => {
    const startIdx = text.indexOf(ACTION_START);
    const endIdx = text.indexOf(ACTION_END);

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        return { cleanText: text.trim(), actionPayload: null };
    }

    const jsonStr = text.slice(startIdx + ACTION_START.length, endIdx).trim();
    const cleanText = (text.slice(0, startIdx) + text.slice(endIdx + ACTION_END.length)).trim();

    try {
        return { cleanText, actionPayload: JSON.parse(jsonStr) };
    } catch {
        return { cleanText, actionPayload: null };
    }
};

// Execute a CRUD action from the AI
const executeAction = async (
    payload: any,
    context: ChatContext,
    callbacks: CRUDCallbacks
): Promise<ExecutedAction> => {
    const { type, data } = payload;

    try {
        switch (type) {
            case 'add_product': {
                if (!callbacks.addProduct) throw new Error('Add product not available');
                const newProduct: Omit<Product, 'id'> = {
                    name: data.name,
                    sku: data.sku || `SKU-${Date.now()}`,
                    barcode: undefined,
                    category: data.category || 'General',
                    price: Number(data.price) || 0,
                    cost: Number(data.cost) || 0,
                    stock: Number(data.stock) || 0,
                    reorderLevel: Number(data.reorderLevel) || 10,
                    supplierId: '',
                    supplierIds: [],
                    warehouseId: undefined,
                    imageUrl: undefined,
                };
                await callbacks.addProduct(newProduct);
                return { type, status: 'success', detail: `Added "${data.name}" to inventory.` };
            }
            case 'update_stock': {
                if (!callbacks.updateProduct) throw new Error('Update not available');
                const item = context.analytics.find(
                    a => a.product.id === data.productId || a.product.name.toLowerCase() === (data.productName || '').toLowerCase()
                );
                if (!item) throw new Error(`Product "${data.productName}" not found`);
                await callbacks.updateProduct({ ...item.product, stock: Number(data.newStock) });
                return { type, status: 'success', detail: `Stock for "${item.product.name}" updated to ${data.newStock} units.` };
            }
            case 'update_price': {
                if (!callbacks.updateProduct) throw new Error('Update not available');
                const item = context.analytics.find(
                    a => a.product.id === data.productId || a.product.name.toLowerCase() === (data.productName || '').toLowerCase()
                );
                if (!item) throw new Error(`Product "${data.productName}" not found`);
                await callbacks.updateProduct({ ...item.product, price: Number(data.newPrice) });
                return { type, status: 'success', detail: `Price for "${item.product.name}" updated to ₹${data.newPrice}.` };
            }
            case 'delete_product': {
                if (!callbacks.deleteProduct) throw new Error('Delete not available');
                const item = context.analytics.find(
                    a => a.product.id === data.productId || a.product.name.toLowerCase() === (data.productName || '').toLowerCase()
                );
                if (!item) throw new Error(`Product "${data.productName}" not found`);
                await callbacks.deleteProduct(item.product.id);
                return { type, status: 'success', detail: `"${item.product.name}" has been deleted from inventory.` };
            }
            case 'reorder_flag':
                return { type, status: 'success', detail: `Reorder suggestion logged for "${data.productName}" — ${data.suggestedQty} units recommended.` };
            default:
                return { type, status: 'error', detail: `Unknown action type: ${type}` };
        }
    } catch (err: any) {
        return { type, status: 'error', detail: err.message || 'Action failed' };
    }
};

const MOCK_RESPONSES: Record<string, string> = {
    'low stock': `Based on current inventory analysis:

🔴 Critical Stock Items require immediate attention.
🟡 Low Stock Items are approaching reorder thresholds.

Recommended Actions:
1. Place emergency orders for critical items
2. Review reorder levels to prevent future stockouts`,

    'selling': `📈 Top Selling Products analysis from sales data available.

Check the Dashboard for detailed sales velocity and trend data.`,

    'default': `I can help you with:
• Inventory queries — "Show me low stock items"
• Sales analysis — "What's selling fastest?"
• Supplier info — "Which supplier has the longest lead time?"
• Reorder suggestions — "What should I reorder?"
• Stock updates — "Add 50 units to Wireless Mouse"
• New products — "Add a new product: NeuralNet Chip at ₹4500, 20 in stock"
• Delete items — "Remove Quantum CPU from inventory"

What would you like to do?`
};

const getMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('low') || lowerQuery.includes('critical') || lowerQuery.includes('stock')) {
        return MOCK_RESPONSES['low stock'];
    }
    if (lowerQuery.includes('sell') || lowerQuery.includes('fastest') || lowerQuery.includes('popular') || lowerQuery.includes('top')) {
        return MOCK_RESPONSES['selling'];
    }
    return MOCK_RESPONSES['default'];
};

export const sendChatMessage = async (
    userMessage: string,
    context: ChatContext,
    conversationHistory: ChatMessage[],
    crudCallbacks: CRUDCallbacks = {}
): Promise<{ text: string; action?: ExecutedAction }> => {
    const inventoryContext = formatInventoryContext(context);

    const historyText = conversationHistory.slice(-4).map(msg =>
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    const fullPrompt = `${inventoryContext}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}User: ${userMessage}

Please respond helpfully based on the inventory data above. If the user wants to perform a CRUD operation, embed the action block as instructed.`;

    try {
        const rawResponse = await generateText({
            prompt: fullPrompt,
            systemPrompt: SYSTEM_PROMPT
        });

        const { cleanText, actionPayload } = parseAction(rawResponse);

        let executedAction: ExecutedAction | undefined;
        if (actionPayload) {
            executedAction = await executeAction(actionPayload, context, crudCallbacks);
        }

        return { text: cleanText.replace(/\*+/g, '').trim(), action: executedAction };
    } catch (error: any) {
        console.error('[AIChatbot] Gemini error:', error?.message || error);
        if (error?.message === 'QUOTA_EXCEEDED') {
            return {
                text: "⚠️ AI quota limit reached. Here's what I found from the data:\n\n" + getMockResponse(userMessage)
            };
        }
        return {
            text: `⚠️ AI temporarily unavailable (${error?.message || 'unknown error'}). Here's cached data:\n\n` + getMockResponse(userMessage)
        };
    }
};

export const getQuickActions = (): string[] => [
    "Show me low stock items",
    "What's selling fastest?",
    "Which items need reordering?",
    "Summarize inventory health"
];
