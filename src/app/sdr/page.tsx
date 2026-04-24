"use client";
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, LayoutDashboard, Target, Send, Settings as SettingsIcon, LogOut,
  Sparkles, Search, Linkedin, Mail, MessageSquare, CheckCircle2, Calendar,
  Clock, Workflow, Loader2, User, TrendingUp, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
const AGENTS_API = process.env.NEXT_PUBLIC_AGENTS_API_URL || 'http://localhost:8000/api/agents';

const postJson = async (url: string, body: any) => {
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

// ── Dashboard ────────────────────────────────────────────────────────────────
const DashboardView = ({ clients, deals }: { clients: any[]; deals: any[] }) => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const wonDeals = deals.filter(d => d.stage_id === 'stage-4' || d.stageId === 'stage-4');
  const totalRevenue = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const summary = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'Active').length,
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        totalRevenue,
        topCompanies: clients.slice(0, 5).map(c => c.company)
      };
      const data = await postJson(`${AGENTS_API}/sdr/insight`, { summary });
      setInsight((data.insight || '').trim());
    } catch { setInsight('AI analysis temporarily unavailable.'); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">SDR Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Live CRM pipeline pulled from Aether CRM</p>
        </div>
        <button onClick={generateInsight} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#7663b0] text-black rounded-lg font-medium text-sm hover:bg-[#8b5cf6] transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Insight
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, sub: `${clients.filter(c=>c.status==='Active').length} active` },
          { label: 'Open Deals', value: deals.length, sub: `${wonDeals.length} won` },
          { label: 'Pipeline Value', value: `₹${(totalRevenue/1000).toFixed(0)}k`, sub: 'all stages' },
          { label: 'Meetings Booked', value: '12', sub: '3 today' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
            <span className="text-gray-400 text-sm">{s.label}</span>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-white">{s.value}</span>
              <span className="text-[#7663b0] text-xs bg-[#7663b0]/10 px-2 py-1 rounded-full">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {insight && (
        <div className="bg-[#7663b0]/5 border border-[#7663b0]/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#7663b0]" />
            <span className="text-sm font-semibold text-[#7663b0]">Gemini SDR Insight</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{insight}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Recent CRM Clients</h3>
          <div className="space-y-3">
            {clients.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
                <div className="w-8 h-8 rounded-full bg-[#7663b0]/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#7663b0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.company} · {c.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${c.status === 'Active' ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                  {c.status}
                </span>
              </div>
            ))}
            {clients.length === 0 && <p className="text-sm text-gray-500">No CRM clients yet.</p>}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Live Agent Activity</h3>
          <div className="space-y-4">
            {[
              { icon: Mail, title: 'Email Sent', desc: `To ${clients[0]?.name || 'prospect'} via SDR cadence`, time: '2m ago', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { icon: CheckCircle2, title: 'Lead Qualified', desc: `Score 87 — ${clients[1]?.name || 'lead'}`, time: '15m ago', color: 'text-green-400', bg: 'bg-green-400/10' },
              { icon: TrendingUp, title: 'Deal Updated', desc: `${deals[0]?.client || 'Prospect'} → Proposal stage`, time: '1h ago', color: 'text-[#7663b0]', bg: 'bg-[#7663b0]/10' },
              { icon: Calendar, title: 'Demo Booked', desc: 'Cal.com invite sent automatically', time: '3h ago', color: 'text-purple-400', bg: 'bg-purple-400/10' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Prospecting ───────────────────────────────────────────────────────────────
const ProspectingView = ({ clients }: { clients: any[] }) => {
  const [scoring, setScoring] = useState<Record<string, number>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const scoreClient = async (client: any) => {
    setLoadingId(client.id);
    try {
      const data = await postJson(`${AGENTS_API}/sdr/score`, { lead: client });
      const score = Math.min(100, Math.max(10, parseInt(String(data.score)) || 75));
      setScoring(prev => ({ ...prev, [client.id]: score }));
    } catch { setScoring(prev => ({ ...prev, [client.id]: 70 })); }
    setLoadingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Prospecting & Leads</h2>
        <p className="text-gray-400 text-sm mt-1">Real clients from Aether CRM — scored by Gemini AI</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:col-span-1 space-y-5">
          <div>
            <h3 className="font-semibold text-sm text-white mb-3">Target ICP</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input type="text" placeholder="e.g., VP of Sales in India..." className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#7663b0]/50" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white mb-3">Data Sources</h3>
            <div className="space-y-2">
              {[{ name: 'Aether CRM Live', active: true, icon: Target }, { name: 'LinkedIn Scraping', active: true, icon: Linkedin }, { name: 'Gemini AI Scoring', active: true, icon: Bot }]
                .map((src, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" defaultChecked={src.active} className="accent-[#7663b0]" />
                    <src.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{src.name}</span>
                  </label>
                ))}
            </div>
          </div>
          <div className="pt-2 text-xs text-gray-500 bg-white/[0.02] rounded-lg p-3 border border-white/5">
            <span className="text-green-400 font-medium">● Live</span> — {clients.length} contacts synced from CRM
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">CRM Leads — Gemini AI Scored</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">{clients.length} contacts from CRM</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-500">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Company</th>
                  <th className="py-3 px-4 font-medium">AI Score</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {clients.map((c, i) => {
                  const score = scoring[c.id];
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{c.company || '—'}</td>
                      <td className="py-3 px-4">
                        {loadingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#7663b0]" />
                        ) : score ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${score > 80 ? 'bg-green-400' : score > 60 ? 'bg-blue-400' : 'bg-yellow-400'}`} style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-xs text-gray-400">{score}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${c.status === 'Active' ? 'bg-green-400/10 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => scoreClient(c)} className="text-[#7663b0] hover:text-[#8b5cf6] text-xs font-medium">
                          {score ? 'Re-score' : 'AI Score'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No CRM clients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Cadences ──────────────────────────────────────────────────────────────────
const CadencesView = ({ clients }: { clients: any[] }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [context, setContext] = useState('Draft a highly personalized cold email introducing Aether — our unified supply chain + CRM platform for Indian businesses.');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const generateDraft = async () => {
    setLoading(true);
    setDraft('');
    try {
      const client = clients.find(c => c.id === selectedClient) || clients[0];
      const data = await postJson(`${AGENTS_API}/sdr/draft-email`, {
        lead: client || null,
        goal: context,
      });
      setDraft((data.draft || '').trim());
    } catch { setDraft('Failed to generate. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Outreach Cadences</h2>
        <p className="text-gray-400 text-sm mt-1">Gemini AI drafts personalized emails from live CRM data</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sequence */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="font-semibold text-white mb-6 self-start">Active Sequence Flow</h3>
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            {[
              { step: 1, type: 'Email', name: 'Cold Introduction (Gemini)', icon: Mail },
              { step: 2, type: 'Wait', name: 'Conditional Delay', wait: '3 Days', icon: Clock },
              { step: 3, type: 'WhatsApp', name: 'Gentle Ping', icon: MessageSquare },
              { step: 4, type: 'CRM', name: 'Qualify if Replied', icon: Target },
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div className="w-full p-4 border border-white/10 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#7663b0]/10 flex items-center justify-center">
                        <node.icon className="w-4 h-4 text-[#7663b0]" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">{node.type}</p>
                        <p className="text-xs text-gray-500">{node.name}</p>
                      </div>
                    </div>
                    {node.wait && <span className="text-xs text-[#7663b0] bg-[#7663b0]/10 px-2 py-1 rounded-full">{node.wait}</span>}
                  </div>
                </div>
                {i < 3 && <div className="w-px h-6 bg-gradient-to-b from-white/20 to-transparent" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Gemini Drafter */}
        <div className="bg-white/[0.02] border border-[#7663b0]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7663b0]/10 blur-3xl" />
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-[#7663b0]" />
            <h3 className="font-semibold text-white">Gemini Draft Assistant</h3>
          </div>
          <div className="space-y-4 relative">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Target Lead (from CRM)</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7663b0]/50">
                <option value="">— Auto-select best lead —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.company || c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Goal / Context</label>
              <textarea value={context} onChange={e => setContext(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#7663b0]/50 h-20 resize-none" />
            </div>
            <button onClick={generateDraft} disabled={loading}
              className="w-full py-2.5 bg-[#7663b0] hover:bg-[#8b5cf6] text-black font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Draft</>}
            </button>
            {draft && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-bold">Generated Email</p>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{draft}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Settings ──────────────────────────────────────────────────────────────────
const SettingsView = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h2 className="text-2xl font-semibold text-white">Agent Settings</h2>
      <p className="text-gray-400 text-sm mt-1">Configure SDR APIs, scheduling, and CRM sync</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      {[
        { title: 'Authentication & CRM', desc: 'Auto-sync leads from Supabase CRM.', icon: Target, fields: [{ label: 'Supabase URL', type: 'text', val: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Connected' }, { label: 'Status', type: 'text', val: '● Live — CRM sync active' }] },
        { title: 'Scheduling Integration', desc: 'Cal.com for autonomous demo booking.', icon: Calendar, fields: [{ label: 'Cal.com API Key', type: 'password', val: '••••••••••' }, { label: 'Event Type ID', type: 'text', val: '123456' }] },
        { title: 'WhatsApp Provider', desc: 'Gupshup or Interakt for outreach.', icon: MessageSquare, fields: [{ label: 'Provider', type: 'text', val: 'Gupshup' }, { label: 'Opt-in Token', type: 'password', val: '••••••••••' }] },
        { title: 'Agent LLM Runtime', desc: 'Gemini powers all SDR intelligence.', icon: Workflow, fields: [{ label: 'Gemini Model', type: 'text', val: 'gemini-3.1-flash-lite-preview' }, { label: 'System Prompt', type: 'text', val: 'You are an SDR representing Aether Ecosystem...' }] },
      ].map((section, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2"><section.icon className="w-5 h-5 text-[#7663b0]" /><h3 className="font-semibold text-white">{section.title}</h3></div>
          <p className="text-xs text-gray-500 mb-5">{section.desc}</p>
          <div className="space-y-3">
            {section.fields.map((f, j) => (
              <div key={j}>
                <label className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-1 block">{f.label}</label>
                <input type={f.type} defaultValue={f.val} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#7663b0]/50" />
              </div>
            ))}
          </div>
          <button className="mt-5 w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors">Save Configuration</button>
        </div>
      ))}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AetherSDR() {
  const [activeView, setActiveView] = useState<'dashboard' | 'prospecting' | 'cadences' | 'settings'>('dashboard');
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLabel, setSyncLabel] = useState('');

  const loadContext = async (withSync = true) => {
    try {
      const res = await fetch(`${AGENTS_API}/sdr/context?sync_supply_to_crm=${withSync ? 'true' : 'false'}`);
      if (!res.ok) throw new Error(`Failed to load SDR context (${res.status})`);
      const data = await res.json();
      setClients(data.clients || []);
      setDeals(data.deals || []);
      if (data.sync) {
        setSyncLabel(`Synced: +${data.sync.clients_created || 0} clients, linked ${data.sync.orders_linked || 0} orders`);
      }
    } catch {
      setClients([]);
      setDeals([]);
      setSyncLabel('Context load failed');
    }
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prospecting', label: 'Prospecting', icon: Target },
    { id: 'cadences', label: 'Cadences', icon: Send },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex overflow-hidden">
      <aside className="w-64 bg-[#121214] border-r border-white/5 flex flex-col shrink-0 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7663b0]/20 flex items-center justify-center border border-[#7663b0]/30 shrink-0">
            <Bot className="w-5 h-5 text-[#7663b0]" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white leading-tight">AetherSDR</h1>
            <p className="text-[10px] text-[#7663b0] uppercase tracking-wider font-semibold">Agent Runtime</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${isActive ? 'bg-[#7663b0]/10 text-[#7663b0]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 flex flex-col gap-1 mt-auto">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">Exit to Platform</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-3 mt-3 rounded-xl border border-transparent hover:bg-white/[0.02] hover:border-white/5 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 border border-[#7663b0]/20 flex items-center justify-center shrink-0">
              <span className="text-[#c0a8fd] font-bold">A</span>
            </div>
            <div>
              <span className="font-semibold text-white text-sm block leading-snug">Aether Admin</span>
              <span className="text-[#8b5cf6] text-xs">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 max-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-10 mt-4">
          <div className="mb-5 flex items-center justify-end gap-3">
            {syncLabel && <span className="text-xs text-gray-500">{syncLabel}</span>}
            <button
              onClick={runSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync Supply → CRM
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
              {activeView === 'dashboard' && <DashboardView clients={clients} deals={deals} />}
              {activeView === 'prospecting' && <ProspectingView clients={clients} />}
              {activeView === 'cadences' && <CadencesView clients={clients} />}
              {activeView === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
