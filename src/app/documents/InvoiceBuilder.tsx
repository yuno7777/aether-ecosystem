"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Minus, Wand2, Download, Loader2, AlertCircle,
  RefreshCw, Trash2, FileText, CheckCircle2,
} from 'lucide-react';
import { ExtractedLineItem, draftInvoiceWithAI } from '../../services/documentService';
import { CompanySettings, defaultSettings } from './SettingsPanel';
import dynamic from 'next/dynamic';

// Lazy-load react-pdf (SSR incompatible)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button disabled className="w-full px-4 py-3 bg-purple-500/30 text-white/40 font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading PDF engine…
      </button>
    ),
  }
);

import InvoicePDF from './InvoicePDF';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
  const safe = isNaN(n) || !isFinite(n) ? 0 : n;
  return `₹${safe.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const safeNum = (v: string | number) => {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

const EMPTY_ITEM = (): ExtractedLineItem => ({
  description: '', quantity: 1, unitPrice: 0, total: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function InvoiceBuilderView() {
  // Settings from localStorage
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);

  // Invoice header fields
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(nextMonth.toISOString().split('T')[0]);

  // Line items
  const [items, setItems] = useState<ExtractedLineItem[]>([EMPTY_ITEM()]);
  const [taxRate, setTaxRate] = useState(10);

  // AI draft
  const [aiPrompt, setAiPrompt] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aether_docs_settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  // ── item mutation helpers ──────────────────────────────────────────────────
  const updateItem = useCallback((i: number, field: keyof ExtractedLineItem, raw: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[i], [field]: raw };
      const qty = safeNum(item.quantity);
      const price = safeNum(item.unitPrice);
      item.total = parseFloat((qty * price).toFixed(2));
      next[i] = item;
      return next;
    });
  }, []);

  const addItem = () => setItems(p => [...p, EMPTY_ITEM()]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const clearItems = () => setItems([EMPTY_ITEM()]);

  // ── AI Draft ──────────────────────────────────────────────────────────────
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsDrafting(true);
    setError(null);
    setDraftSuccess(false);
    try {
      const generated = await draftInvoiceWithAI(aiPrompt);
      if (generated.length > 0) {
        setItems(generated);
        setAiPrompt('');
        setDraftSuccess(true);
        setTimeout(() => setDraftSuccess(false), 3000);
      } else {
        setError('AI could not identify any line items. Try a more specific prompt.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate line items.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIGenerate();
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, item) => s + safeNum(item.total), 0);
  const taxAmount = parseFloat(((subtotal * safeNum(taxRate)) / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-5xl mx-auto flex gap-8"
    >
      {/* ── Left: form ── */}
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Invoice Builder</h2>
          <p className="text-sm text-gray-400">Generate a professional invoice with AI or manual entry.</p>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 hover:text-red-300">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Assist ── */}
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Draft Assist</h3>
            {draftSuccess && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="ml-auto flex items-center gap-1 text-xs text-green-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Items generated
              </motion.span>
            )}
          </div>
          <div className="flex gap-3">
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 20 hours of frontend dev at ₹5000/hr and 5 hours of design at ₹6500/hr"
              rows={2}
              disabled={isDrafting}
              className="flex-1 bg-black/40 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleAIGenerate}
              disabled={isDrafting || !aiPrompt.trim()}
              className="px-5 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/20 disabled:text-white/30 text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shrink-0 min-w-[96px]"
            >
              {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /> Generate</>}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">Press Enter to generate · Shift+Enter for new line</p>
        </div>

        {/* ── Client + Invoice Details ── */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Client Company LLC"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Client Address</label>
              <textarea
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                rows={3}
                placeholder={"123 Client St\nNew York, NY 10001"}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 outline-none resize-none transition-colors"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500/50 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:border-purple-500/50 outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:border-purple-500/50 outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Line Items ── */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Line Items</label>
            <div className="flex items-center gap-3">
              {items.length > 1 && (
                <button
                  onClick={clearItems}
                  className="text-xs text-gray-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
              <button
                onClick={addItem}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="flex gap-3 mb-2 px-1">
            <span className="flex-1 text-[10px] uppercase tracking-wider text-gray-600 font-bold">Description</span>
            <span className="w-20 text-[10px] uppercase tracking-wider text-gray-600 font-bold text-right">Qty</span>
            <span className="w-28 text-[10px] uppercase tracking-wider text-gray-600 font-bold text-right">Unit Price</span>
            <span className="w-28 text-[10px] uppercase tracking-wider text-gray-600 font-bold text-right">Total</span>
            <span className="w-9" />
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-3 items-center"
                >
                  {/* Description */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="Service or product description"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 outline-none transition-colors"
                    />
                  </div>
                  {/* Qty */}
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      placeholder="1"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:border-purple-500/50 outline-none transition-colors"
                    />
                  </div>
                  {/* Unit Price */}
                  <div className="w-28 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice === 0 ? '' : item.unitPrice}
                      onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white text-right focus:border-purple-500/50 outline-none transition-colors"
                    />
                  </div>
                  {/* Total (read-only) */}
                  <div className="w-28 bg-white/5 border border-white/5 rounded-lg px-3 py-2 flex items-center justify-end">
                    <span className="text-sm font-semibold text-purple-300">
                      {fmt(safeNum(item.total))}
                    </span>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-200 font-medium tabular-nums">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-gray-500 flex items-center gap-2">
                  Tax
                  <span className="relative inline-flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={e => setTaxRate(safeNum(e.target.value))}
                      className="w-14 bg-black/40 border border-white/10 rounded px-2 py-0.5 text-xs text-white outline-none text-right"
                    />
                    <span className="ml-1 text-gray-500">%</span>
                  </span>
                </span>
                <span className="text-gray-200 font-medium tabular-nums">{fmt(taxAmount)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-purple-400 font-bold">Total Due</span>
                <span className="text-purple-400 font-bold text-xl tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Preview + Download ── */}
      <div className="w-72 shrink-0">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 sticky top-8 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Document Actions</h3>

          {/* Mock preview thumbnail */}
          <div className="w-full aspect-[1/1.4] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 p-4 flex flex-col gap-2 pointer-events-none">
            {/* Header row */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-2">
              <div className="w-8 h-8 rounded bg-purple-100" />
              <div className="text-right space-y-1">
                <div className="h-2.5 w-20 bg-purple-200 rounded" />
                <div className="h-1.5 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            {/* Invoice title */}
            <div className="h-3 w-16 bg-gray-800 rounded mt-1" />
            {/* Client + meta row */}
            <div className="flex justify-between mt-1">
              <div className="space-y-1">
                <div className="h-2 w-14 bg-gray-200 rounded" />
                <div className="h-1.5 w-20 bg-gray-100 rounded" />
              </div>
              <div className="space-y-1 items-end flex flex-col">
                <div className="h-1.5 w-16 bg-gray-200 rounded" />
                <div className="h-1.5 w-12 bg-gray-100 rounded" />
              </div>
            </div>
            {/* Table rows */}
            <div className="mt-2 space-y-1 flex-1">
              {[...Array(Math.min(items.length, 4))].map((_, i) => (
                <div key={i} className="h-2 bg-gray-100 rounded w-full" />
              ))}
            </div>
            {/* Totals */}
            <div className="border-t border-gray-200 pt-2 space-y-1">
              <div className="h-1.5 w-16 bg-gray-200 rounded ms-auto" />
              <div className="h-2 w-20 bg-purple-200 rounded ms-auto" />
            </div>
          </div>

          {/* Invoice summary */}
          <div className="space-y-2 text-sm">
            {clientName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="text-gray-200 truncate max-w-[140px]">{clientName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="text-gray-200">{items.filter(i => i.description).length} line item{items.filter(i => i.description).length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-purple-400">Total</span>
              <span className="text-purple-400 tabular-nums">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Download button */}
          <PDFDownloadLink
            document={
              <InvoicePDF
                settings={settings}
                clientName={clientName}
                clientAddress={clientAddress}
                invoiceNumber={invoiceNumber}
                issueDate={issueDate}
                dueDate={dueDate}
                items={items}
                subtotal={subtotal}
                taxRate={taxRate}
                taxAmount={taxAmount}
                total={grandTotal}
              />
            }
            fileName={`${invoiceNumber || 'invoice'}.pdf`}
            className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-400 text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {/* @ts-ignore */}
            {({ loading }) =>
              loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF…</>
              ) : (
                <><Download className="w-4 h-4" /> Download PDF</>
              )
            }
          </PDFDownloadLink>

          <p className="text-[11px] text-center text-gray-600">
            PDF uses your company settings & logo from the Settings tab.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
