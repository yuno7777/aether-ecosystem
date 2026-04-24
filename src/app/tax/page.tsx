// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  Calculator, LogOut, CheckCircle2, AlertCircle, FileWarning,
  ArrowRight, ShieldCheck, RefreshCw, Send, Sparkles, Building2,
  FileSpreadsheet, Scale, ReceiptIndianRupee, Upload, X, AlertTriangle,
  Brain, TrendingUp, Loader2
} from 'lucide-react';
import { useAuth, ROLE_META } from '../../auth/AuthProvider';
import {
  fetchTaxOverview, fetchReconciliation, fetchNotices,
  syncGSTData, fetchAIRecommendations, summarizeNotice,
  sendCAAlert,
  TaxSummary, TaxReconciliationRow, NoticeAlert, AIRecommendation,
} from '../../services/taxService';

type View = 'dashboard' | 'reconciliation' | 'notices';

const SIDEBAR_ITEMS = [
  { id: 'dashboard' as View, label: 'Tax Overview', icon: Calculator },
  { id: 'reconciliation' as View, label: 'GSTR Reconciliation', icon: Scale },
  { id: 'notices' as View, label: 'Portal Notices', icon: FileWarning },
];

export default function TaxPage() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [invoices, setInvoices] = useState<TaxReconciliationRow[]>([]);
  const [notices, setNotices] = useState<NoticeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const { user, logout } = useAuth();

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovr, rec, ntc] = await Promise.all([
        fetchTaxOverview(),
        fetchReconciliation(),
        fetchNotices(),
      ]);
      setSummary(ovr);
      setInvoices(rec);
      setNotices(ntc);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data from AetherTax backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSyncComplete = async () => {
    setShowSyncModal(false);
    await loadAll();
  };

  const noticeCount = notices.filter(n => n.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-purple-500/30 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0a0a0c] z-10 shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/20 rounded-lg blur-sm" />
              <ShieldCheck className="absolute w-6 h-6 text-purple-400" strokeWidth={2} />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">AetherTax</span>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-purple-500/10 text-purple-300' : 'text-gray-400 hover:text-purple-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium">{item.label}</span>
                {item.id === 'notices' && noticeCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center border border-red-500/30">
                    {noticeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors w-full text-left group">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Exit to Platform</span>
          </Link>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors w-full text-left">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
              <div className={`w-10 h-10 rounded-full ${ROLE_META[user.role].bg} border ${ROLE_META[user.role].border} flex items-center justify-center text-sm font-bold ${ROLE_META[user.role].color}`}>
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-purple-100">{user.name}</span>
                <span className={`text-[10px] font-medium ${ROLE_META[user.role].color}`}>{ROLE_META[user.role].label}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md z-10 shrink-0">
          <h1 className="text-lg font-semibold text-white">
            {activeView === 'dashboard' && 'Tax Compliance Overview'}
            {activeView === 'reconciliation' && 'GSTR-1 vs GSTR-2B Reconciliation'}
            {activeView === 'notices' && 'GST Portal Notices'}
          </h1>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Backend offline
              </span>
            )}
            <button
              onClick={() => setShowSyncModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-black font-medium text-xs rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Sync GST Data
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading live tax data…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' && (
                <DashboardView key="dash" summary={summary} invoices={invoices} error={error} />
              )}
              {activeView === 'reconciliation' && (
                <ReconciliationView key="rec" invoices={invoices} summary={summary} />
              )}
              {activeView === 'notices' && (
                <NoticesView
                  key="notices"
                  notices={notices}
                  onNoticeUpdate={(updated) =>
                    setNotices(prev => prev.map(n => n.id === updated.id ? updated : n))
                  }
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Sync CSV Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <SyncModal onClose={() => setShowSyncModal(false)} onComplete={handleSyncComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sync CSV Modal ─── */

function SyncModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [gstr1, setGstr1] = useState<File | null>(null);
  const [gstr2b, setGstr2b] = useState<File | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSync = async () => {
    if (!gstr1 || !gstr2b) return;
    setSyncing(true);
    setErr(null);
    try {
      const res = await syncGSTData(gstr1, gstr2b);
      setResult(res);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-md p-6 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Sync GST Data</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload GSTR-1 and GSTR-2B CSV files to reconcile</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-gray-500 bg-white/[0.03] border border-white/5 rounded-xl p-3 leading-relaxed">
          <span className="text-gray-300 font-medium">Required columns:</span>{' '}
          <code className="text-purple-400">invoice_number</code>,{' '}
          <code className="text-purple-400">vendor_name</code>,{' '}
          <code className="text-purple-400">gstin</code>,{' '}
          <code className="text-purple-400">value</code>,{' '}
          <code className="text-purple-400">invoice_date</code>
        </div>

        <FileDropZone label="GSTR-1 (Sales)" file={gstr1} onFile={setGstr1} />
        <FileDropZone label="GSTR-2B (Purchase Portal)" file={gstr2b} onFile={setGstr2b} />

        {err && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            {err}
          </p>
        )}

        {result ? (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Sync complete
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="Total" value={result.total} />
              <Stat label="Matched" value={result.matched} color="text-purple-400" />
              <Stat label="Flagged" value={result.high_risk_flagged} color="text-red-400" />
            </div>
            <button
              onClick={onComplete}
              className="mt-2 w-full py-2 bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold rounded-lg transition-colors"
            >
              View Results
            </button>
          </div>
        ) : (
          <button
            onClick={handleSync}
            disabled={!gstr1 || !gstr2b || syncing}
            className="w-full py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-black font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {syncing ? <><Loader2 className="w-4 h-4 animate-spin" /> Reconciling & scoring…</> : 'Sync & Reconcile'}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function FileDropZone({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1.5 font-medium">{label}</p>
      <button
        onClick={() => ref.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl px-4 py-4 text-sm transition-colors flex items-center justify-center gap-2 ${
          file
            ? 'border-purple-500/40 bg-purple-500/5 text-purple-300'
            : 'border-white/10 hover:border-purple-500/40 text-gray-500 hover:text-gray-300'
        }`}
      >
        <FileSpreadsheet className="w-4 h-4" />
        {file ? file.name : `Choose ${label} CSV…`}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

function Stat({ label, value, color = 'text-white' }: { label: string; value: any; color?: string }) {
  return (
    <div className="bg-black/30 rounded-lg py-2 px-1">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

/* ─── Dashboard View ─── */

function DashboardView({ summary, invoices, error }: { summary: TaxSummary | null; invoices: TaxReconciliationRow[]; error: string | null }) {
  const flagged = invoices.filter(i => i.isFlagged).length;
  const s = summary ?? { totalSalesLiability: 0, totalItcAvailable: 0, totalItcLost: 0, netPayable: 0, highRiskCount: 0, period: 'No data yet' };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Backend at <code className="text-amber-300">http://localhost:8000</code> is unreachable. Showing empty state — sync your data once the service is running.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          icon={<ReceiptIndianRupee className="w-16 h-16 text-purple-400" />}
          label="Total Liability"
          value={`₹${(s.totalSalesLiability / 100000).toFixed(2)}L`}
          sub="As per Books (GSTR-1)"
          subColor="text-purple-400"
        />
        <Card
          icon={<CheckCircle2 className="w-16 h-16 text-purple-400" />}
          label="Available ITC"
          value={`₹${(s.totalItcAvailable / 100000).toFixed(2)}L`}
          valueColor="text-purple-400"
          sub="Auto-pop in GSTR-2B"
          subColor="text-gray-400"
        />
        <Card
          icon={<FileWarning className="w-16 h-16 text-amber-400" />}
          label="Potential ITC Loss"
          value={`₹${(s.totalItcLost / 1000).toFixed(1)}K`}
          valueColor="text-amber-400"
          sub="Action required to claim"
          subColor="text-amber-500"
          highlight="amber"
        />
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
          <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Est. Net Payable</p>
          <p className="text-3xl font-bold text-white">₹{(s.netPayable / 100000).toFixed(2)}L</p>
          <div className="mt-4 pt-4 border-t border-purple-500/20 flex flex-col gap-1">
            {flagged > 0 && (
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {flagged} invoices ML-flagged as high-risk
              </p>
            )}
            <button className="w-full py-1.5 bg-purple-500 hover:bg-purple-400 text-black rounded text-xs font-bold transition-colors">
              Prepare Return
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" /> ML Anomaly Detection Active
          </h3>
          <p className="text-sm text-gray-400 mt-2 max-w-xl leading-relaxed">
            AetherTax runs every invoice through an Isolation Forest model trained on financial transaction patterns.
            Invoices with an anomaly score &gt; 0.7 are automatically flagged for review.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-purple-400">
          <Building2 className="w-8 h-8 opacity-50" />
          <ArrowRight className="w-5 h-5 opacity-30" />
          <ShieldCheck className="w-12 h-12" />
          <ArrowRight className="w-5 h-5 opacity-30" />
          <TrendingUp className="w-8 h-8 opacity-50" />
        </div>
      </div>
    </motion.div>
  );
}

function Card({ icon, label, value, valueColor = 'text-white', sub, subColor, highlight }: any) {
  const border = highlight === 'amber' ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-white/[0.02]';
  return (
    <div className={`border rounded-2xl p-6 relative overflow-hidden ${border}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">{icon}</div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-light ${valueColor}`}>{value}</p>
      <div className="mt-4 pt-4 border-t border-white/5">
        <span className={`text-[10px] font-medium ${subColor}`}>{sub}</span>
      </div>
    </div>
  );
}

/* ─── Reconciliation View ─── */

function ReconciliationView({ invoices, summary }: { invoices: TaxReconciliationRow[]; summary: TaxSummary | null }) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const getRecommendations = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const recs = await fetchAIRecommendations();
      setRecommendations(recs);
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const statusColors = {
    matched: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    mismatch: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    missing_in_portal: 'bg-red-500/10 text-red-400 border-red-500/20',
    missing_in_books: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  const statusLabels = {
    matched: 'Matched',
    mismatch: 'Value Mismatch',
    missing_in_portal: 'Missing in 2B',
    missing_in_books: 'Missing in Books',
  };

  const priorityColors = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-green-400' };

  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6">
      {/* Table */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-lg font-semibold text-white">Purchase Match Ledger</h2>
            <p className="text-xs text-gray-500 mt-1">
              {invoices.length === 0 ? 'No data — sync a CSV to begin' : `${invoices.length} invoices · sorted by risk`}
            </p>
          </div>
          <button
            onClick={getRecommendations}
            disabled={isAnalyzing || invoices.length === 0}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAnalyzing ? 'Analyzing…' : 'AI Reconcile'}
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 opacity-40">
            <FileSpreadsheet className="w-10 h-10 text-gray-500" />
            <p className="text-sm text-gray-400">Upload GSTR-1 & GSTR-2B to see reconciliation data</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#121214] sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">Invoice</th>
                  <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">Vendor</th>
                  <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5 text-right">Books</th>
                  <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5 text-right">Portal</th>
                  <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">Status</th>
                  <th className="px-5 py-3 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={row.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${row.isFlagged ? 'bg-red-500/[0.02]' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white flex items-center gap-1.5">
                        {row.isFlagged && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                        {row.invoiceNumber}
                      </p>
                      <p className="text-[10px] text-gray-500">{row.date}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-300">{row.vendorName}</p>
                      <p className="text-[10px] text-gray-500">{row.gstin}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm">₹{row.bookAmount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right pr-5">
                      <div className="flex flex-col items-end">
                        <span className="text-sm">₹{row.portalAmount.toLocaleString()}</span>
                        {row.portalAmount !== row.bookAmount && (
                          <span className="text-[10px] text-amber-400">Diff: ₹{Math.abs(row.bookAmount - row.portalAmount).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${statusColors[row.status] ?? statusColors.mismatch}`}>
                        {statusLabels[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <AnomalyBadge score={row.anomalyScore} flagged={row.isFlagged} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* AI Advisory */}
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="w-full xl:w-[420px] shrink-0">
        <div className="bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl h-full flex flex-col overflow-hidden">
          <div className="p-5 border-b border-purple-500/20 bg-black/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-purple-400">Gemini Compliance Advisor</h2>
          </div>
          <div className="p-5 flex-1 overflow-auto">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <Spinner />
                <p className="text-purple-400/80 text-sm animate-pulse">Running Gemini across GSTR-2B mismatches…</p>
              </div>
            ) : aiError ? (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4">{aiError}</div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{rec.invoice_number}</p>
                      <span className={`text-[10px] font-bold uppercase ${priorityColors[rec.priority] ?? 'text-gray-400'}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{rec.vendor_name}</p>
                    <p className="text-[11px] text-amber-400 font-medium">{rec.issue_type}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{rec.recommended_action}</p>
                    <AnomalyBadge score={rec.anomaly_score} />
                  </div>
                ))}
              </div>
            ) : recommendations && recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-60">
                <CheckCircle2 className="w-10 h-10 text-purple-400" />
                <p className="text-sm text-gray-400">All invoices are matched — no action required.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-50">
                <ShieldCheck className="w-12 h-12 text-purple-400" />
                <p className="text-sm text-gray-400">Click "AI Reconcile" to generate Gemini-powered action items for all mismatches.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Notices View ─── */

function NoticesView({ notices, onNoticeUpdate }: { notices: NoticeAlert[]; onNoticeUpdate: (n: NoticeAlert) => void }) {
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const handleSummarize = async (id: string) => {
    setSummarizing(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await summarizeNotice(id);
      onNoticeUpdate(updated);
    } catch (e) {
      console.error('Summarize failed', e);
    } finally {
      setSummarizing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleAlertCA = async (id: string, subject: string) => {
    await sendCAAlert(`NOTICE ALERT: ${subject}`);
    setSent(prev => ({ ...prev, [id]: true }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">GST Portal Notices</h2>
          <p className="text-sm text-gray-400">Automated monitoring of DRC-01 and ASMT portal alerts.</p>
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 opacity-40">
          <CheckCircle2 className="w-10 h-10 text-gray-500" />
          <p className="text-sm text-gray-400">No notices on record.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map(n => (
            <div key={n.id} className="bg-red-500/[0.03] border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4 hover:bg-red-500/5 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      {n.severity} SEVERITY
                    </span>
                    <span className="text-xs text-gray-400">Received: {n.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{n.subject}</h3>
                  {n.description && <p className="text-sm text-gray-400 mb-1">{n.description}</p>}
                  <p className="text-sm text-gray-400">
                    Due Date: <span className="text-white font-medium">{n.dueDate}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleAlertCA(n.id, n.subject)}
                    disabled={sent[n.id]}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                      sent[n.id] ? 'bg-white/5 text-gray-500 border border-white/10' : 'bg-red-500 hover:bg-red-400 text-white'
                    }`}
                  >
                    {sent[n.id] ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {sent[n.id] ? 'CA Notified' : 'Alert CA'}
                  </button>
                  {!n.geminiSummary && (
                    <button
                      onClick={() => handleSummarize(n.id)}
                      disabled={summarizing[n.id]}
                      className="px-4 py-2 rounded-lg text-sm font-bold border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all flex items-center gap-2 disabled:opacity-40"
                    >
                      {summarizing[n.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {summarizing[n.id] ? 'Analyzing…' : 'AI Summary'}
                    </button>
                  )}
                </div>
              </div>
              {n.geminiSummary && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini Analysis
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{n.geminiSummary}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Helpers ─── */

function AnomalyBadge({ score, flagged }: { score: number | null; flagged?: boolean }) {
  if (score === null || score === undefined) return <span className="text-[10px] text-gray-600">—</span>;
  const pct = Math.round(score * 100);
  const color = score > 0.7 ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : score > 0.4 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-green-400 bg-green-500/10 border-green-500/20';
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold tabular-nums ${color}`}>
      {pct}%
    </span>
  );
}

const Spinner = () => (
  <svg className="animate-spin w-8 h-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
