// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  Search,
  MessageCircle,
  Inbox,
  Megaphone,
  Store,
  Globe,
  Bot,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Users,
  RefreshCw,
  IndianRupee,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const AGENTS_API = process.env.NEXT_PUBLIC_AGENTS_API_URL || 'http://localhost:8000/api/agents';

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  selling_price: number;
  category: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  status: string;
}

function DashboardView({ products, clients }: { products: Product[]; clients: Client[] }) {
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const totalValue = products.reduce((s, p) => s + p.stock_quantity * (p.selling_price || 0), 0);
  const lowStock = products.filter(p => p.stock_quantity < 20).length;
  const activeClients = clients.filter(c => c.status === 'Active').length;

  const generateInsight = async () => {
    setLoadingInsight(true);
    try {
      const summary = {
        products: products.length,
        lowStock,
        inventoryValue: totalValue,
        clients: clients.length,
        activeClients,
        topCategories: [...new Set(products.map(p => p.category))].slice(0, 4),
      };
      const data = await postJson(`${AGENTS_API}/commerce/brief`, { summary });
      setAiInsight((data.brief || '').trim());
    } catch {
      setAiInsight('Unable to generate insight right now.');
    }
    setLoadingInsight(false);
  };

  const stats = [
    { title: 'Products in Catalog', value: products.length.toString(), metric: `${lowStock} low stock`, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Inventory Value', value: `₹${(totalValue / 100000).toFixed(1)}L`, metric: 'live from Supply', icon: IndianRupee, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'CRM Contacts', value: clients.length.toString(), metric: `${activeClients} active`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'AI Deflection Rate', value: '86%', metric: 'vs 14% human', icon: Bot, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Commerce Overview</h2>
          <p className="text-gray-400 text-sm mt-1">Live Supply + CRM context with server-side Gemini</p>
        </div>
        <button
          onClick={generateInsight}
          disabled={loadingInsight}
          className="flex items-center gap-2 px-4 py-2 bg-[#7663b0] text-black rounded-lg font-medium text-sm hover:bg-[#8b5cf6] transition-colors disabled:opacity-50"
        >
          {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Brief
        </button>
      </div>

      {aiInsight && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-sm text-gray-300">
          <div className="flex items-center gap-2 mb-2 text-purple-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Gemini Executive Brief
          </div>
          {aiInsight}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">{stat.title}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-[#7663b0] text-xs font-semibold bg-[#7663b0]/10 px-2 py-1 rounded-full">{stat.metric}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#7663b0]" /> Live Product Catalog (Aether Supply)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/5">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium text-right">Stock</th>
                <th className="pb-3 font-medium text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.slice(0, 8).map(p => (
                <tr key={p.id}>
                  <td className="py-3 font-medium text-white">{p.name}</td>
                  <td className="py-3 text-gray-400">{p.category}</td>
                  <td className="py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className={`py-3 text-right font-medium ${p.stock_quantity < 20 ? 'text-red-400' : 'text-emerald-400'}`}>{p.stock_quantity}</td>
                  <td className="py-3 text-right">₹{(p.selling_price || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const MOCK_CHATS = [
  { name: '+91 98765 43210', msg: 'I want to speak to a human', time: '1m', active: true, tag: 'Handoff' },
  { name: '+91 87654 32109', msg: 'Payment failed but money deducted', time: '5m', active: false, tag: 'Urgent' },
];

const MOCK_MESSAGES = [
  { from: 'user', text: 'I need to change my delivery address for order #4922.', time: '11:42 AM' },
  { from: 'bot', text: 'I can help with this. Do you want me to transfer you to a human agent?', time: '11:43 AM' },
  { from: 'user', text: 'Yes please.', time: '11:44 AM' },
];

function InboxView({ products }: { products: Product[] }) {
  const [reply, setReply] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const suggestReply = async () => {
    setLoadingSuggestion(true);
    try {
      const catalogSnippet = products.slice(0, 5).map(p => `${p.name} (₹${p.selling_price}, stock: ${p.stock_quantity})`).join(', ');
      const data = await postJson(`${AGENTS_API}/commerce/reply-suggestion`, {
        message_context: 'Customer wants to change delivery address after confirming order #4922. They paid via UPI.',
        catalog_snippet: catalogSnippet,
      });
      const suggestion = (data.suggestion || '').trim();
      setReply(suggestion);
      setAiSuggestion(suggestion);
    } catch {
      setAiSuggestion('Failed to generate suggestion.');
    }
    setLoadingSuggestion(false);
  };

  return (
    <div className="flex flex-col h-[75vh]">
      <div>
        <h2 className="text-2xl font-semibold text-white">Live Operations Inbox</h2>
        <p className="text-gray-400 text-sm mt-1">Human handoff with server-side AI suggestions</p>
      </div>

      <div className="flex flex-1 mt-6 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="w-80 border-r border-white/5 flex flex-col bg-black/20 shrink-0">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input type="text" placeholder="Search conversations..." className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {MOCK_CHATS.map((chat, i) => (
              <div key={i} className={`p-4 border-b border-white/5 ${chat.active ? 'bg-[#7663b0]/10 border-l-2 border-l-[#7663b0]' : 'hover:bg-white/[0.02]'}`}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-sm text-white truncate">{chat.name}</span>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mb-2">{chat.msg}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{chat.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/30">
            <div>
              <h3 className="font-semibold text-white">+91 98765 43210</h3>
              <p className="text-xs text-orange-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> AI paused. Waiting for human agent.</p>
            </div>
            <button onClick={suggestReply} disabled={loadingSuggestion} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-400 hover:bg-purple-500/20">
              {loadingSuggestion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Suggest
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {MOCK_MESSAGES.map((m, i) => (
              m.from === 'user' ? (
                <div key={i} className="bg-[#7663b0]/10 border border-[#7663b0]/20 max-w-sm rounded-xl p-3 text-gray-300 mr-auto rounded-tl-none">{m.text}</div>
              ) : (
                <div key={i} className="bg-white/5 border border-white/10 max-w-sm rounded-xl p-3 text-white ml-auto rounded-tr-none">
                  <div className="flex items-center gap-1 mb-1 text-[#7663b0] text-xs font-medium"><Bot className="w-3 h-3" /> AI Agent</div>
                  {m.text}
                </div>
              )
            ))}
          </div>

          {aiSuggestion && (
            <div className="mx-4 mb-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
              <p className="text-xs text-purple-400 font-medium mb-1">Gemini Suggestion</p>
              <p className="text-xs text-gray-300">{aiSuggestion}</p>
            </div>
          )}

          <div className="p-4 border-t border-white/5 bg-black/30">
            <div className="flex gap-2">
              <input type="text" value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your message..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm" />
              <button className="bg-[#7663b0] text-black w-10 flex items-center justify-center rounded-lg hover:bg-[#8b5cf6]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignsView({ products, clients }: { products: Product[]; clients: Client[] }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [targetLang, setTargetLang] = useState('Hindi');

  const product = products.find(p => p.id === selectedProduct);
  const activeClients = clients.filter(c => c.status === 'Active').length;

  const generateBroadcast = async () => {
    if (!product) return;
    setLoadingMsg(true);
    try {
      const data = await postJson(`${AGENTS_API}/commerce/broadcast`, {
        product,
        campaign_name: campaignName || 'General Promotion',
        extra_context: customContext || '',
      });
      setGeneratedMsg((data.message || '').trim());
    } catch {
      setGeneratedMsg('Failed to generate message.');
    }
    setLoadingMsg(false);
  };

  const translateMessage = async () => {
    if (!generatedMsg) return;
    setLoadingMsg(true);
    try {
      const data = await postJson(`${AGENTS_API}/commerce/translate`, {
        text: generatedMsg,
        target_language: targetLang,
      });
      setGeneratedMsg((data.message || '').trim());
    } catch {
      setGeneratedMsg('Translation failed.');
    }
    setLoadingMsg(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Broadcast Campaigns</h2>
        <p className="text-gray-400 text-sm mt-1">Use Gemini with live catalog and CRM audience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> Gemini Broadcast Generator</h3>
          <div className="space-y-3">
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white">
              <option value="">-- Choose a product --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.selling_price} (stock: {p.stock_quantity})</option>)}
            </select>
            <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white" />
            <textarea value={customContext} onChange={e => setCustomContext(e.target.value)} placeholder="Extra context..." rows={2} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white resize-none" />
            <button onClick={generateBroadcast} disabled={!selectedProduct || loadingMsg} className="w-full py-2.5 bg-[#7663b0] hover:bg-[#8b5cf6] text-black rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              {loadingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate with Gemini
            </button>
            {generatedMsg && (
              <>
                <textarea value={generatedMsg} onChange={e => setGeneratedMsg(e.target.value)} rows={6} className="w-full bg-black/30 border border-purple-500/20 rounded-xl p-4 text-sm text-gray-200 resize-none" />
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white appearance-none">
                      <option>Hindi</option>
                      <option>Marathi</option>
                      <option>Tamil</option>
                      <option>Telugu</option>
                      <option>Gujarati</option>
                    </select>
                  </div>
                  <button onClick={translateMessage} disabled={loadingMsg} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${loadingMsg ? 'animate-spin' : ''}`} /> Translate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Target Audience</h3>
          <div className="space-y-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm font-medium text-white">All CRM Contacts</p>
              <p className="text-xs text-gray-400 mt-1">{clients.length} contacts</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-sm font-medium text-white">Active Segment</p>
              <p className="text-xs text-gray-400 mt-1">{activeClients} active contacts</p>
            </div>
            {product && (
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <p className="text-xs text-purple-400 font-medium mb-1">Selected Product</p>
                <p className="text-sm text-white font-medium">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">₹{product.selling_price?.toLocaleString('en-IN')} · {product.stock_quantity} units</p>
              </div>
            )}
          </div>
          <button disabled={!generatedMsg} className="w-full py-3 bg-white text-black font-semibold rounded-xl text-sm hover:bg-gray-200 mt-4 disabled:opacity-40">
            Push Broadcast to {clients.length} Users
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Integration Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Commerce is now API-driven via Aether agents backend.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {[
          { title: 'Catalog Sync', icon: Store, value: 'Active via /api/agents/commerce/context' },
          { title: 'CRM Sync', icon: Users, value: 'Active via /api/agents/sync/supply-to-crm' },
          { title: 'Gemini Runtime', icon: Sparkles, value: 'Server-side only (GEMINI_API_KEY)' },
          { title: 'Inbox Assist', icon: Inbox, value: 'Active via /api/agents/commerce/reply-suggestion' },
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <item.icon className="w-4 h-4 text-[#7663b0]" />
              <h3 className="font-semibold text-white">{item.title}</h3>
            </div>
            <p className="text-xs text-gray-400">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AetherCommerce() {
  const [activeView, setActiveView] = useState<'dashboard' | 'inbox' | 'campaigns' | 'settings'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLabel, setSyncLabel] = useState('');

  const loadContext = async (withSync = true) => {
    setLoading(true);
    try {
      const res = await fetch(`${AGENTS_API}/commerce/context?sync_supply_to_crm=${withSync ? 'true' : 'false'}`);
      if (!res.ok) throw new Error(`Failed to load context (${res.status})`);
      const data = await res.json();
      setProducts(data.products || []);
      setClients(data.clients || []);
      if (data.sync) setSyncLabel(`Synced: +${data.sync.clients_created || 0} clients, linked ${data.sync.orders_linked || 0} orders`);
    } catch {
      setProducts([]);
      setClients([]);
      setSyncLabel('Context load failed');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContext(true);
  }, []);

  const runSync = async () => {
    setIsSyncing(true);
    try {
      const data = await postJson(`${AGENTS_API}/sync/supply-to-crm`, { limit: 300 });
      setSyncLabel(`Synced: +${data.clients_created || 0} clients, linked ${data.orders_linked || 0} orders`);
      await loadContext(false);
    } catch {
      setSyncLabel('Sync failed');
    }
    setIsSyncing(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Live Inbox', icon: Inbox },
    { id: 'campaigns', label: 'Broadcasts', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex overflow-hidden">
      <aside className="w-64 bg-[#121214] border-r border-white/5 flex flex-col shrink-0 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7663b0]/20 flex items-center justify-center border border-[#7663b0]/30 shrink-0">
            <MessageCircle className="w-5 h-5 text-[#7663b0]" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white leading-tight">Commerce</h1>
            <p className="text-[10px] text-[#7663b0] uppercase tracking-wider font-semibold">WhatsApp AI Edge</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left ${isActive ? 'bg-[#7663b0]/10 text-[#7663b0]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors w-full text-left">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">Exit to Platform</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 max-h-screen overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-screen">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#7663b0]" />
              <p className="text-sm">Loading live data...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto p-10 mt-6">
            <div className="mb-5 flex items-center justify-end gap-3">
              {syncLabel && <span className="text-xs text-gray-500">{syncLabel}</span>}
              <button onClick={runSync} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50">
                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sync Supply → CRM
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                {activeView === 'dashboard' && <DashboardView products={products} clients={clients} />}
                {activeView === 'inbox' && <InboxView products={products} />}
                {activeView === 'campaigns' && <CampaignsView products={products} clients={clients} />}
                {activeView === 'settings' && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
