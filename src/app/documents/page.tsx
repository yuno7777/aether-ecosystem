// @ts-nocheck
"use client";
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  FileText, Upload, Hexagon, LogOut, Sparkles, Table2, Download,
  ChevronRight, BarChart3, FileSpreadsheet, FileJson, Eye,
  CheckCircle2, Clock, AlertCircle, Trash2, X, Search,
  ArrowRight, Shield, FolderOpen, Loader2, Zap, FileUp,
  Settings, FilePlus
} from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import InvoiceBuilderView from './InvoiceBuilder';
import AetherChat from './AetherChat';
import { useAuth, ROLE_META } from '../../auth/AuthProvider';
import {
  ExtractedDocument, fetchAllDocuments, uploadAndProcessDocument, deleteDocumentFromServer,
  exportToCSV, exportToJSON
} from '../../services/documentService';

type View = 'upload' | 'documents' | 'viewer' | 'invoice_builder' | 'settings';

const SIDEBAR_ITEMS = [
  { id: 'upload' as View, label: 'Upload & Process', icon: Upload },
  { id: 'documents' as View, label: 'Processed Documents', icon: FolderOpen },
  { id: 'invoice_builder' as View, label: 'Invoice Builder', icon: FilePlus },
  { id: 'settings' as View, label: 'Settings', icon: Settings },
];

export default function DocumentsPage() {
  const [activeView, setActiveView] = useState<View>('upload');
  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ExtractedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const { user, logout } = useAuth();

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  React.useEffect(() => {
    fetchAllDocuments().then(setDocuments);
  }, []);

  const handleFileDrop = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      setIsProcessing(true);
      setProcessingFile(file.name);
      try {
        const extracted = await uploadAndProcessDocument(file);
        if (extracted) {
          setDocuments(prev => [extracted, ...prev]);
          if (extracted.status === 'failed') {
            showToast(`⚠️ ${file.name} uploaded but AI extraction failed. You can delete it and retry.`, 'error');
          }
        }
      } catch (err: any) {
        showToast(`Failed to process "${file.name}": ${err?.message || 'Unknown error'}`, 'error');
      }
      setIsProcessing(false);
      setProcessingFile(null);
    }
    setActiveView('documents');
  }, []);

  const handleViewDoc = (doc: ExtractedDocument) => {
    setSelectedDoc(doc);
    setActiveView('viewer');
  };

  const handleDeleteDoc = async (id: string) => {
    const result = await deleteDocumentFromServer(id);
    if (result.ok) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setActiveView('documents');
      }
      showToast('Document deleted', 'success');
    } else {
      showToast(`Delete failed: ${result.error}`, 'error');
    }
  };

  const handleExportCSV = (doc: ExtractedDocument) => {
    const csv = exportToCSV(doc);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fileName.replace(/\.[^.]+$/, '')}_extracted.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = (doc: ExtractedDocument) => {
    const json = exportToJSON(doc);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.fileName.replace(/\.[^.]+$/, '')}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-purple-500/30 flex overflow-hidden">
      {/* Toast notifications */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 max-w-sm ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 ml-2">✕</button>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0a0a0c] z-10 shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/20 rounded-lg blur-sm" />
              <Hexagon className="absolute w-6 h-6 text-purple-400" strokeWidth={2} />
              <FileText className="absolute w-3 h-3 text-purple-300" strokeWidth={3} />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">AetherDocs</span>
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
                <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors w-full text-left group">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">Return to Home</span>
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
        {/* Header */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              {activeView === 'upload' && 'Upload & Process'}
              {activeView === 'documents' && 'Processed Documents'}
              {activeView === 'viewer' && selectedDoc?.fileName}
              {activeView === 'invoice_builder' && 'Create Custom Invoice'}
              {activeView === 'settings' && 'Company Settings'}
            </h1>
            {activeView === 'viewer' && selectedDoc && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {selectedDoc.fileType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isProcessing && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span className="text-xs text-purple-400">Processing {processingFile}...</span>
              </div>
            )}
            <span className="text-xs text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''} processed</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeView === 'upload' && (
              <UploadView
                key="upload"
                onFileDrop={handleFileDrop}
                isProcessing={isProcessing}
              />
            )}
            {activeView === 'documents' && (
              <DocumentsList
                key="documents"
                documents={documents}
                onView={handleViewDoc}
                onDelete={handleDeleteDoc}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
                onUploadMore={() => setActiveView('upload')}
              />
            )}
            {activeView === 'viewer' && selectedDoc && (
              <DocumentViewer
                key="viewer"
                doc={selectedDoc}
                onBack={() => setActiveView('documents')}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
              />
            )}
            {activeView === 'invoice_builder' && (
              <InvoiceBuilderView key="invoice_builder" />
            )}
            {activeView === 'settings' && (
              <SettingsPanel key="settings" />
            )}
          </AnimatePresence>
        </div>
      </main>
      {/* AetherDocs AI floating chatbot */}
      <AetherChat />
    </div>
  );
}


/* ─── Upload View ─── */
function UploadView({ onFileDrop, isProcessing }: { onFileDrop: (files: FileList | File[]) => void; isProcessing: boolean }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileDrop(e.target.files);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-500/10 border border-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="w-10 h-10 text-purple-400" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">Intelligent Document Processing</h2>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          Upload invoices, contracts, receipts, or purchase orders. Our Gemini-powered engine extracts structured data automatically.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-16 text-center cursor-pointer group ${
          isDragging
            ? 'border-purple-400 bg-purple-500/5 scale-[1.02]'
            : 'border-white/10 bg-white/[0.01] hover:border-purple-500/30 hover:bg-purple-500/[0.02]'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <div className="absolute -inset-4 bg-purple-500/5 rounded-3xl animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Processing document...</p>
              <p className="text-xs text-gray-500 mt-1">Extracting structured data with Gemini AI</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-purple-500/20' : 'bg-white/5 group-hover:bg-purple-500/10'}`}>
                <FileUp className={`w-8 h-8 transition-colors ${isDragging ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Drop files here or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">Supports PDF, Images (JPG/PNG), and Text files</p>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
              multiple
              onChange={handleFileInput}
            />
          </>
        )}
      </div>

      {/* How it works */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Upload,
            title: 'Upload',
            desc: 'Drop invoices, receipts, contracts, or purchase orders in any format.',
            color: 'fuchsia',
          },
          {
            icon: Sparkles,
            title: 'AI Extraction',
            desc: 'Gemini AI parses and extracts every field, line item, and financial detail.',
            color: 'violet',
          },
          {
            icon: Zap,
            title: 'Export Anywhere',
            desc: 'Push structured data to CSV, JSON, CRM, or accounting tools instantly.',
            color: 'emerald',
          },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl bg-${step.color}-500/10 border border-${step.color}-500/20 flex items-center justify-center mb-4`}>
              <step.icon className={`w-5 h-5 text-${step.color}-400`} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Supported formats */}
      <div className="mt-10 flex items-center justify-center gap-6">
        {['PDF', 'JPG', 'PNG', 'TXT', 'CSV'].map(fmt => (
          <span key={fmt} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] font-bold tracking-wider text-gray-500 uppercase">{fmt}</span>
        ))}
      </div>
    </motion.div>
  );
}


/* ─── Documents List ─── */
function DocumentsList({
  documents, onView, onDelete, onExportCSV, onExportJSON, onUploadMore
}: {
  documents: ExtractedDocument[];
  onView: (doc: ExtractedDocument) => void;
  onDelete: (id: string) => void;
  onExportCSV: (doc: ExtractedDocument) => void;
  onExportJSON: (doc: ExtractedDocument) => void;
  onUploadMore: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = documents.filter(d =>
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (documents.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-sm text-gray-500">No documents processed yet</p>
        <button
          onClick={onUploadMore}
          className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-black font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Upload Documents
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 w-72 transition-colors"
          />
        </div>
        <button
          onClick={onUploadMore}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-black font-medium rounded-lg text-xs transition-colors flex items-center gap-2"
        >
          <Upload className="w-3.5 h-3.5" /> Upload More
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Document</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Type</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Vendor</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Amount</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Status</th>
              <th className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{doc.fileName}</p>
                      <p className="text-[10px] text-gray-500">{doc.documentNumber || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    doc.fileType === 'invoice' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    doc.fileType === 'receipt' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    doc.fileType === 'contract' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {doc.fileType}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-300">{doc.vendorName || '—'}</td>
                <td className="px-5 py-4 text-sm font-medium text-white">
                  {doc.totalAmount ? `${doc.currency || 'INR'} ${doc.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    {doc.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    ) : doc.status === 'processing' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={`text-xs ${
                      doc.status === 'completed' ? 'text-purple-400' :
                      doc.status === 'processing' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(doc)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onExportCSV(doc)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-purple-400 transition-colors" title="Export CSV">
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button onClick={() => onExportJSON(doc)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-blue-400 transition-colors" title="Export JSON">
                      <FileJson className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}


/* ─── Document Viewer ─── */
function DocumentViewer({
  doc, onBack, onExportCSV, onExportJSON
}: {
  doc: ExtractedDocument;
  onBack: () => void;
  onExportCSV: (doc: ExtractedDocument) => void;
  onExportJSON: (doc: ExtractedDocument) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'line_items' | 'raw'>('overview');

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    header: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    financial: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    party: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    terms: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    metadata: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
    line_item: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Documents
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => onExportCSV(doc)} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => onExportJSON(doc)} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5">
            <FileJson className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/5 border border-white/5 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Vendor</p>
            <p className="text-sm font-medium text-white">{doc.vendorName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Document #</p>
            <p className="text-sm font-medium text-purple-400">{doc.documentNumber || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Date</p>
            <p className="text-sm font-medium text-white">{doc.documentDate || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total</p>
            <p className="text-lg font-bold text-purple-400">
              {doc.totalAmount ? `₹${doc.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Fields Extracted</p>
            <p className="text-sm font-medium text-white">{doc.fields.length} fields</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 leading-relaxed">{doc.summary}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white/[0.02] rounded-xl p-1 border border-white/5 w-fit">
        {(['overview', 'fields', 'line_items', 'raw'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'fields' ? 'All Fields' : tab === 'line_items' ? 'Line Items' : 'Raw Text'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grouped fields */}
            {Object.entries(
              doc.fields.reduce((acc, f) => {
                const cat = f.category;
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(f);
                return acc;
              }, {} as Record<string, typeof doc.fields>)
            ).map(([category, fields]) => {
              const colors = categoryColors[category] || categoryColors.metadata;
              return (
                <div key={category} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} mb-4`}>
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="space-y-3">
                    {fields.map((f, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{f.key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{f.value}</span>
                          <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full ${f.confidence > 0.9 ? 'bg-purple-500' : f.confidence > 0.7 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${f.confidence * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'fields' && (
          <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Field</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Value</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Category</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.fields.map((f, i) => {
                    const colors = categoryColors[f.category] || categoryColors.metadata;
                    return (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-xs font-medium text-white">{f.key}</td>
                        <td className="px-5 py-3 text-xs text-gray-300">{f.value}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {f.category}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full ${f.confidence > 0.9 ? 'bg-purple-500' : f.confidence > 0.7 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${f.confidence * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-500">{(f.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'line_items' && (
          <motion.div key="line_items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Description</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Qty</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Unit Price</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 px-5 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.lineItems.map((item, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-sm text-white">{item.description}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-300 text-right">{item.quantity}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-300 text-right">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-white text-right">₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={3} className="px-5 py-3.5 text-sm font-semibold text-gray-300 text-right">Total</td>
                    <td className="px-5 py-3.5 text-lg font-bold text-purple-400 text-right">
                      ₹{doc.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'raw' && (
          <motion.div key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
                {doc.rawText || 'Raw text not available for this document.'}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
