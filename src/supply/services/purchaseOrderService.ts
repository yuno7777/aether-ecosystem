// @ts-nocheck
import { generateText } from './aiService';
import { ProductAnalytics, Supplier } from "../types";

export interface PurchaseOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface PurchaseOrder {
    id: string;
    supplier: Supplier;
    items: PurchaseOrderItem[];
    totalValue: number;
    status: 'draft' | 'pending' | 'sent' | 'confirmed';
    createdAt: Date;
    emailDraft: string;
    urgency: 'normal' | 'urgent' | 'critical';
}

export const generatePurchaseOrders = (analytics: ProductAnalytics[]): PurchaseOrder[] => {
    const supplierGroups = new Map<string, { supplier: Supplier; items: ProductAnalytics[] }>();

    analytics.forEach(item => {
        if (item.suggestedReorderQty > 0 && item.supplier) {
            const existing = supplierGroups.get(item.supplier.id);
            if (existing) {
                existing.items.push(item);
            } else {
                supplierGroups.set(item.supplier.id, {
                    supplier: item.supplier,
                    items: [item]
                });
            }
        }
    });

    const orders: PurchaseOrder[] = [];

    supplierGroups.forEach(({ supplier, items }) => {
        const poItems: PurchaseOrderItem[] = items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.suggestedReorderQty,
            unitPrice: item.product.price * 0.6,
            totalPrice: item.suggestedReorderQty * item.product.price * 0.6
        }));

        const totalValue = poItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const hasCritical = items.some(i => i.status === 'Critical');
        const hasLow = items.some(i => i.status === 'Low');
        const urgency: PurchaseOrder['urgency'] = hasCritical ? 'critical' : hasLow ? 'urgent' : 'normal';

        orders.push({
            id: `PO-${Date.now()}-${supplier.id}`,
            supplier,
            items: poItems,
            totalValue,
            status: 'draft',
            createdAt: new Date(),
            emailDraft: '',
            urgency
        });
    });

    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    return orders.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
};

const generateEmailTemplate = (order: PurchaseOrder): string => {
    const itemsList = order.items
        .map(item => `• ${item.productName}: ${item.quantity} units @ $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}`)
        .join('\n');

    const urgencyNote = order.urgency === 'critical'
        ? '\n⚠️ URGENT: This order contains items with critical stock levels. Please expedite processing.\n'
        : order.urgency === 'urgent'
            ? '\n📌 Priority: Some items in this order have low stock levels.\n'
            : '';

    return `Subject: Purchase Order ${order.id} - Aether Supply
${urgencyNote}
Dear ${order.supplier.name} Team,

We would like to place the following order:

ORDER DETAILS:
${itemsList}

---
Total Order Value: $${order.totalValue.toFixed(2)}
Requested Delivery: ${order.supplier.leadTimeDays} business days

Please confirm receipt of this order and provide an estimated delivery date.

Best regards,
Aether Supply Procurement Team
procurement@aethersupply.com`;
};

export const generateAIEmail = async (order: PurchaseOrder): Promise<string> => {
    const template = generateEmailTemplate(order);

    const prompt = `Improve this purchase order email to be more professional and persuasive while keeping all the key information. Make it concise but friendly. Keep the subject line and order details exact.

Original Email:
${template}

Return only the improved email text, nothing else.`;

    try {
        const response = await generateText({
            prompt,
            systemPrompt: "You are a procurement specialist."
        });
        return response;
    } catch (error) {
        console.error("PO email generation error:", error);
        return template;
    }
};

export const generateMailtoLink = (order: PurchaseOrder, emailBody: string): string => {
    const subject = encodeURIComponent(`Purchase Order ${order.id} - Aether Supply`);
    const body = encodeURIComponent(emailBody);
    return `mailto:${order.supplier.contactEmail}?subject=${subject}&body=${body}`;
};
