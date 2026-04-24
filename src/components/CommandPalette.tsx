// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Users, Briefcase, Truck, ArrowRight, Command, FileText, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types for search results
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'product' | 'client' | 'deal' | 'supplier' | 'document' | 'tax';
  icon: React.ElementType;
  href: string;
  meta?: string;
}

// Mock data sources — in a real app these would come from a shared context/store
const MOCK_PRODUCTS = [
  { id: 'prod-1', name: 'Quantum Processors (Q-100)', sku: 'QT-100-PROC', category: 'Electronics', price: 450, stock: 450 },
  { id: 'prod-2', name: 'Lithium-Ion Battery Packs', sku: 'LI-PACK-500', category: 'Raw Materials', price: 85, stock: 120 },
  { id: 'prod-3', name: 'Eco-Friendly Shipping Boxes', sku: 'ECO-BOX-MD', category: 'Packaging', price: 2.5, stock: 15000 },
  { id: 'prod-4', name: 'Industrial Thermal Paste', sku: 'THRM-PST-A', category: 'Raw Materials', price: 15, stock: 80 },
  { id: 'prod-5', name: 'LED Display Modules', sku: 'LED-MOD-4K', category: 'Electronics', price: 120, stock: 850 },
  { id: 'prod-6', name: 'Fiber Optic Cables (100m)', sku: 'FBR-OPT-100', category: 'Electronics', price: 210, stock: 20 },
];

const MOCK_CLIENTS = [
  { id: 1, name: 'Eleanor Shellstrop', company: 'Good Place Inc.', email: 'eleanor@goodplace.com', status: 'Active' },
  { id: 2, name: 'Michael Scott', company: 'Dunder Mifflin', email: 'mscott@dundermifflin.com', status: 'Pending' },
  { id: 3, name: 'Leslie Knope', company: 'Pawnee Parks', email: 'leslie@pawnee.gov', status: 'Active' },
  { id: 4, name: 'Ron Swanson', company: 'Very Good Building', email: 'ron@verygood.com', status: 'Inactive' },
];

const MOCK_DEALS = [
  { id: 1, client: 'Acme Corp', value: 12000, stageId: 'lead' },
  { id: 2, client: 'Global Tech', value: 8000, stageId: 'lead' },
  { id: 3, client: 'Stark Ind.', value: 45000, stageId: 'contacted' },
  { id: 4, client: 'Wayne Ent.', value: 22000, stageId: 'contacted' },
  { id: 5, client: 'Oscorp', value: 18000, stageId: 'proposal' },
  { id: 6, client: 'Umbrella Corp', value: 34000, stageId: 'won' },
  { id: 7, client: 'Cyberdyne', value: 55000, stageId: 'won' },
];

const MOCK_SUPPLIERS = [
  { id: 'sup-1', name: 'Global Tech Components', location: 'Shenzhen, CN', rating: 4.8 },
  { id: 'sup-2', name: 'Apex Logistics', location: 'Berlin, DE', rating: 4.5 },
  { id: 'sup-3', name: 'Quantum Materials', location: 'Austin, TX', rating: 4.2 },
  { id: 'sup-4', name: 'Neon Packaging Co.', location: 'London, UK', rating: 4.9 },
];

const CATEGORY_CONFIG = {
  product: { icon: Package, label: 'Products', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  client: { icon: Users, label: 'Clients', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  deal: { icon: Briefcase, label: 'Deals', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  supplier: { icon: Truck, label: 'Suppliers', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  document: { icon: FileText, label: 'Documents', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  tax: { icon: Calculator, label: 'Compliance', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Build search index
  const allResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];

    MOCK_PRODUCTS.forEach(p => {
      results.push({
        id: `product-${p.id}`,
        title: p.name,
        subtitle: `${p.category} · SKU: ${p.sku}`,
        category: 'product',
        icon: Package,
        href: '/supply',
        meta: `${p.stock} in stock · ${formatCurrency(p.price)}`,
      });
    });

    MOCK_CLIENTS.forEach(c => {
      results.push({
        id: `client-${c.id}`,
        title: c.name,
        subtitle: c.company,
        category: 'client',
        icon: Users,
        href: '/crm',
        meta: c.status,
      });
    });

    MOCK_DEALS.forEach(d => {
      results.push({
        id: `deal-${d.id}`,
        title: `Deal: ${d.client}`,
        subtitle: `Stage: ${d.stageId}`,
        category: 'deal',
        icon: Briefcase,
        href: '/crm',
        meta: formatCurrency(d.value),
      });
    });

    MOCK_SUPPLIERS.forEach(s => {
      results.push({
        id: `supplier-${s.id}`,
        title: s.name,
        subtitle: s.location,
        category: 'supplier',
        icon: Truck,
        href: '/supply',
        meta: `Rating: ${s.rating}/5`,
      });
    });

    // Documents
    [
      { id: 'doc-1', name: 'Invoice Processing', desc: 'Upload & extract invoice data' },
      { id: 'doc-2', name: 'Contract Analysis', desc: 'AI-powered contract parsing' },
      { id: 'doc-3', name: 'Receipt Scanner', desc: 'Expense receipt extraction' },
    ].forEach(d => {
      results.push({
        id: `document-${d.id}`,
        title: d.name,
        subtitle: d.desc,
        category: 'document',
        icon: FileText,
        href: '/documents',
        meta: 'AetherDocs',
      });
    });

    // Tax and Compliance
    [
      { id: 'tax-1', name: 'GSTR-2B Reconciliation', desc: 'Match portal ITC with books' },
      { id: 'tax-2', name: 'GST Portal Notices', desc: 'View pending DRC-01/ASMT notices' },
      { id: 'tax-3', name: 'ITC Optimization', desc: 'Identify lost input tax credit' },
    ].forEach(t => {
      results.push({
        id: `tax-${t.id}`,
        title: t.name,
        subtitle: t.desc,
        category: 'tax',
        icon: Calculator,
        href: '/tax',
        meta: 'AetherTax',
      });
    });

    return results;
  }, []);

  // Filter results
  const filtered = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 8);
    const q = query.toLowerCase();
    return allResults.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      (r.meta && r.meta.toLowerCase().includes(q))
    );
  }, [query, allResults]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filtered.forEach(r => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [filtered]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault();
      router.push(filtered[activeIndex].href);
      setIsOpen(false);
    }
  }, [filtered, activeIndex, router]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-2xl"
          >
            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <Search className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, clients, deals, suppliers..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No results for &quot;{query}&quot;</p>
                    <p className="text-xs text-gray-600 mt-1">Try searching for a product name, client, or supplier</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, items]) => {
                    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                    return (
                      <div key={category} className="mb-1">
                        <div className="px-5 py-2 flex items-center gap-2">
                          <config.icon className={`w-3 h-3 ${config.color}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-gray-600">{items.length}</span>
                        </div>
                        {items.map((result) => {
                          flatIndex++;
                          const currentFlatIndex = flatIndex;
                          const isActive = activeIndex === currentFlatIndex;
                          const Icon = result.icon;
                          return (
                            <button
                              key={result.id}
                              data-index={currentFlatIndex}
                              onClick={() => {
                                router.push(result.href);
                                setIsOpen(false);
                              }}
                              onMouseEnter={() => setActiveIndex(currentFlatIndex)}
                              className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                                isActive ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center shrink-0`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white font-medium truncate">{result.title}</div>
                                <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                              </div>
                              {result.meta && (
                                <span className="text-xs text-gray-400 shrink-0">{result.meta}</span>
                              )}
                              {isActive && (
                                <ArrowRight className="w-3.5 h-3.5 text-[#7663b0] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd>
                    Open
                  </span>
                </div>
                <span className="text-[10px] text-gray-600">{filtered.length} results</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
