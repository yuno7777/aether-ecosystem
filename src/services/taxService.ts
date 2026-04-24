// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaxReconciliationRow {
  id: string;
  vendorName: string;
  gstin: string;
  invoiceNumber: string;
  date: string;
  bookAmount: number;
  portalAmount: number;
  status: 'matched' | 'mismatch' | 'missing_in_portal' | 'missing_in_books';
  anomalyScore: number;
  isFlagged: boolean;
  period: string | null;
}

export interface NoticeAlert {
  id: string;
  date: string;
  subject: string;
  severity: 'high' | 'medium' | 'low';
  dueDate: string;
  description: string;
  status: string;
  geminiSummary?: string;
}

export interface TaxSummary {
  period: string;
  totalSalesLiability: number;
  totalItcAvailable: number;
  totalItcLost: number;
  netPayable: number;
  highRiskCount: number;
}

export interface AIRecommendation {
  invoice_number: string;
  vendor_name: string;
  issue_type: string;
  recommended_action: string;
  priority: 'high' | 'medium' | 'low';
  anomaly_score: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TAX_API = 'http://localhost:8000';

// ─── Status mapping from backend to frontend ──────────────────────────────────

function mapStatus(backendStatus: string): TaxReconciliationRow['status'] {
  switch (backendStatus) {
    case 'matched':       return 'matched';
    case 'value_mismatch': return 'mismatch';
    case 'missing_2b':    return 'missing_in_portal';
    case 'missing_books': return 'missing_in_books';
    default:              return 'mismatch';
  }
}

function deriveSeverity(status: string): 'high' | 'medium' | 'low' {
  if (status === 'pending') return 'high';
  if (status === 'resolved') return 'low';
  return 'medium';
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const fetchTaxOverview = async (): Promise<TaxSummary> => {
  const res = await fetch(`${TAX_API}/api/tax/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview');
  const d = await res.json();
  return {
    period: 'Live Data',
    totalSalesLiability: d.total_liability ?? 0,
    totalItcAvailable: d.available_itc ?? 0,
    totalItcLost: d.potential_itc_loss ?? 0,
    netPayable: d.net_payable ?? 0,
    highRiskCount: d.high_risk_count ?? 0,
  };
};

export const fetchReconciliation = async (): Promise<TaxReconciliationRow[]> => {
  const res = await fetch(`${TAX_API}/api/tax/reconciliation`);
  if (!res.ok) throw new Error('Failed to fetch reconciliation');
  const d = await res.json();
  return (d.invoices ?? []).map((r: any, i: number) => ({
    id: r.id ?? String(i),
    vendorName: r.vendor_name ?? '',
    gstin: r.gstin ?? '',
    invoiceNumber: r.invoice_number ?? '',
    date: r.invoice_date ?? '',
    bookAmount: Number(r.value_books ?? 0),
    portalAmount: Number(r.value_portal ?? 0),
    status: mapStatus(r.status),
    anomalyScore: Number(r.anomaly_score ?? 0),
    isFlagged: Boolean(r.is_flagged),
    period: r.period ?? null,
  }));
};

export const fetchNotices = async (): Promise<NoticeAlert[]> => {
  const res = await fetch(`${TAX_API}/api/tax/notices`);
  if (!res.ok) throw new Error('Failed to fetch notices');
  const d = await res.json();
  return (d.notices ?? []).map((n: any) => ({
    id: n.id,
    date: n.issued_date ?? '',
    subject: n.notice_type ?? 'GST Notice',
    severity: deriveSeverity(n.status),
    dueDate: n.due_date ?? '',
    description: n.description ?? '',
    status: n.status ?? 'pending',
    geminiSummary: n.gemini_summary ?? undefined,
  }));
};

export const syncGSTData = async (
  gstr1File: File,
  gstr2bFile: File
): Promise<{ total: number; matched: number; mismatched: number; itc_at_risk: number; high_risk_flagged: number }> => {
  const form = new FormData();
  form.append('gstr1', gstr1File);
  form.append('gstr2b', gstr2bFile);
  const res = await fetch(`${TAX_API}/api/tax/sync`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Sync failed');
  }
  return res.json();
};

export const fetchAIRecommendations = async (): Promise<AIRecommendation[]> => {
  const res = await fetch(`${TAX_API}/api/tax/reconcile-ai`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'AI reconcile failed');
  }
  const d = await res.json();
  return d.recommendations ?? [];
};

export const summarizeNotice = async (noticeId: string): Promise<NoticeAlert> => {
  const res = await fetch(`${TAX_API}/api/tax/notices/${noticeId}/summarize`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to summarize notice');
  const d = await res.json();
  const n = d.notice;
  return {
    id: n.id,
    date: n.issued_date ?? '',
    subject: n.notice_type ?? 'GST Notice',
    severity: deriveSeverity(n.status),
    dueDate: n.due_date ?? '',
    description: n.description ?? '',
    status: n.status ?? 'pending',
    geminiSummary: n.gemini_summary ?? undefined,
  };
};

export const sendCAAlert = async (message: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log('WhatsApp Alert dispatched to CA:', message);
  return true;
};
