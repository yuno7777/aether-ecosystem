"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, AlertTriangle, Clock, TrendingUp, Check, Plus, Trash2 } from 'lucide-react';
import { getAllProductStockStatus, getEstimatedDelivery, StockStatus } from '../services/quoteService';
import { PipelineStage } from '../store';

interface SmartQuoteProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deal: { client: string; value: number; stageId: string }) => void;
  stages: PipelineStage[];
}

export function SmartQuote({ isOpen, onClose, onSubmit, stages }: SmartQuoteProps) {
  const [client, setClient] = useState('');
  const [stageId, setStageId] = useState(stages[0]?.id || 'lead');
  const [selectedProducts, setSelectedProducts] = useState<{ stockStatus: StockStatus; quantity: number }[]>([]);
  
  const allProducts = useMemo(() => getAllProductStockStatus(), []);
  
  const totalValue = selectedProducts.reduce((sum, sp) => {
    // estimate value from stock price approximation
    const basePrice = sp.stockStatus.currentStock > 0 ? Math.round(sp.stockStatus.reorderLevel * 2.5) : 100;
    return sum + basePrice * sp.quantity;
  }, 0);

  const hasWarnings = selectedProducts.some(sp => sp.stockStatus.status !== 'in-stock');
  const estimatedDelivery = getEstimatedDelivery(5, selectedProducts.map(sp => sp.stockStatus));

  const addProduct = (product: StockStatus) => {
    if (selectedProducts.find(sp => sp.stockStatus.productId === product.productId)) return;
    setSelectedProducts(prev => [...prev, { stockStatus: product, quantity: 1 }]);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(sp => sp.stockStatus.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => prev.map(sp =>
      sp.stockStatus.productId === productId ? { ...sp, quantity: Math.max(1, quantity) } : sp
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim()) return;
    onSubmit({ client, value: totalValue, stageId });
    onClose();
    setClient('');
    setSelectedProducts([]);
    setStageId(stages[0]?.id || 'lead');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[8%] left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
          >
            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Smart Quote Builder</h3>
                    <p className="text-xs text-gray-500">Cross-references supply chain stock in real-time</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Client Info */}
                <div className="px-6 py-4 space-y-4 border-b border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Name</label>
                      <input
                        required
                        type="text"
                        value={client}
                        onChange={e => setClient(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Initial Stage</label>
                      <select
                        value={stageId}
                        onChange={e => setStageId(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                      >
                        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Selection */}
                <div className="px-6 py-4 border-b border-white/5">
                  <label className="block text-xs font-medium text-gray-400 mb-3">Add Products from Supply Chain</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {allProducts.filter(p => !selectedProducts.find(sp => sp.stockStatus.productId === p.productId)).map(product => (
                      <button
                        key={product.productId}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-gray-300 hover:border-purple-500/30 hover:bg-purple-500/5 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {product.productName.length > 25 ? product.productName.slice(0, 25) + '...' : product.productName}
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${product.bgColor} ${product.color}`}>
                          {product.status.replace('-', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div className="space-y-2">
                      {selectedProducts.map(sp => (
                        <div key={sp.stockStatus.productId} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${sp.stockStatus.borderColor} ${sp.stockStatus.bgColor}`}>
                          <Package className={`w-4 h-4 shrink-0 ${sp.stockStatus.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white truncate">{sp.stockStatus.productName}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${sp.stockStatus.bgColor} ${sp.stockStatus.color} border ${sp.stockStatus.borderColor}`}>
                                {sp.stockStatus.status.replace('-', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                              <span>Stock: {sp.stockStatus.currentStock}</span>
                              <span>Reorder at: {sp.stockStatus.reorderLevel}</span>
                              {sp.stockStatus.deliveryAdjustmentDays > 0 && (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  +{sp.stockStatus.deliveryAdjustmentDays} days delivery
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={1}
                              value={sp.quantity}
                              onChange={e => updateQuantity(sp.stockStatus.productId, parseInt(e.target.value) || 1)}
                              className="w-16 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-purple-500/50"
                            />
                            <button type="button" onClick={() => removeProduct(sp.stockStatus.productId)} className="p-1 text-gray-500 hover:text-rose-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warnings & Summary */}
                {selectedProducts.length > 0 && (
                  <div className="px-6 py-4 border-b border-white/5 space-y-3">
                    {hasWarnings && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-300">Stock Level Warning</p>
                          <p className="text-[10px] text-amber-400/70 mt-1">
                            Some selected products have low inventory. Estimated delivery has been adjusted by +{Math.max(...selectedProducts.map(sp => sp.stockStatus.deliveryAdjustmentDays))} days to account for restocking time.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Products</p>
                        <p className="text-lg font-semibold text-white mt-1">{selectedProducts.length}</p>
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Delivery</p>
                        <p className="text-lg font-semibold text-white mt-1">{estimatedDelivery}d</p>
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
                        <p className="text-[10px] text-purple-300 uppercase tracking-wider">Deal Value</p>
                        <p className="text-lg font-semibold text-purple-300 mt-1">${totalValue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!client.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-purple-500 hover:bg-purple-400 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Create Smart Deal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
