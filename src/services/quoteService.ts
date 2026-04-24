// @ts-nocheck
import { mockProducts } from '../supply/services/mockData';

export interface StockStatus {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  status: 'in-stock' | 'low' | 'critical' | 'out-of-stock';
  deliveryAdjustmentDays: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function checkProductStock(productName: string): StockStatus | null {
  const product = mockProducts.find(p =>
    p.name.toLowerCase().includes(productName.toLowerCase())
  );

  if (!product) return null;

  let status: StockStatus['status'];
  let deliveryAdjustmentDays = 0;
  let color = '';
  let bgColor = '';
  let borderColor = '';

  if (product.stock === 0) {
    status = 'out-of-stock';
    deliveryAdjustmentDays = 14;
    color = 'text-red-400';
    bgColor = 'bg-red-500/10';
    borderColor = 'border-red-500/20';
  } else if (product.stock < product.reorderLevel * 0.3) {
    status = 'critical';
    deliveryAdjustmentDays = 7;
    color = 'text-red-400';
    bgColor = 'bg-red-500/10';
    borderColor = 'border-red-500/20';
  } else if (product.stock < product.reorderLevel) {
    status = 'low';
    deliveryAdjustmentDays = 3;
    color = 'text-amber-400';
    bgColor = 'bg-amber-500/10';
    borderColor = 'border-amber-500/20';
  } else {
    status = 'in-stock';
    deliveryAdjustmentDays = 0;
    color = 'text-purple-400';
    bgColor = 'bg-purple-500/10';
    borderColor = 'border-purple-500/20';
  }

  return {
    productId: product.id,
    productName: product.name,
    currentStock: product.stock,
    reorderLevel: product.reorderLevel,
    status,
    deliveryAdjustmentDays,
    color,
    bgColor,
    borderColor,
  };
}

export function getAllProductStockStatus(): StockStatus[] {
  return mockProducts.map(product => {
    const result = checkProductStock(product.name);
    return result!;
  }).filter(Boolean);
}

export function getEstimatedDelivery(baselineDays: number, stockStatuses: StockStatus[]): number {
  const maxAdjustment = Math.max(0, ...stockStatuses.map(s => s.deliveryAdjustmentDays));
  return baselineDays + maxAdjustment;
}
