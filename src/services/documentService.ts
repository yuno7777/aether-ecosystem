// @ts-nocheck

import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'http://localhost:8000/api';

const _supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);


export interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  category: 'header' | 'financial' | 'line_item' | 'metadata' | 'party' | 'terms';
}

export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  fileType: 'invoice' | 'receipt' | 'contract' | 'purchase_order' | 'unknown';
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed' | 'pending' | 'done';
  fields: ExtractedField[];
  lineItems: ExtractedLineItem[];
  summary: string;
  rawText?: string;
  totalAmount?: number;
  currency?: string;
  vendorName?: string;
  documentDate?: string;
  documentNumber?: string;
}

// Maps backend format to frontend UI format
export function mapBackendDocToFrontend(backendDoc: any): ExtractedDocument {
  const extracted = backendDoc.extracted_data || {};
  const statusMap = {
    'pending': 'processing',
    'done': 'completed',
    'failed': 'failed'
  };
  
  // Format fields based on JSON response from backend
  const fields: ExtractedField[] = [];
  
  // Convert standard fields
  if (extracted.invoice_number || extracted.documentNumber) {
    fields.push({ key: 'Document Number', value: String(extracted.invoice_number || extracted.documentNumber), confidence: 0.95, category: 'header' });
  }
  if (extracted.date || extracted.documentDate) {
    fields.push({ key: 'Date', value: String(extracted.date || extracted.documentDate), confidence: 0.95, category: 'header' });
  }
  if (extracted.vendor_name || extracted.vendorName) {
    fields.push({ key: 'Vendor Name', value: String(extracted.vendor_name || extracted.vendorName), confidence: 0.95, category: 'party' });
  }
  if (extracted.total_amount || extracted.totalAmount) {
    fields.push({ key: 'Total Amount', value: String(extracted.total_amount || extracted.totalAmount), confidence: 0.95, category: 'financial' });
  }
  if (extracted.name) {
    fields.push({ key: 'Name', value: String(extracted.name), confidence: 0.95, category: 'party' });
  }
  if (extracted.id_number) {
    fields.push({ key: 'ID Number', value: String(extracted.id_number), confidence: 0.95, category: 'metadata' });
  }
  
  // Convert raw JSON keys to fields if they aren't line items
  Object.keys(extracted).forEach(key => {
    if (key !== 'line_items' && key !== 'lineItems' && key !== 'summary' && key !== 'key_entities' && typeof extracted[key] === 'string') {
      // Don't duplicate the standard fields
      if (!['invoice_number', 'date', 'vendor_name', 'total_amount', 'name', 'id_number'].includes(key)) {
        fields.push({ key: key.replace(/_/g, ' '), value: extracted[key], confidence: 0.9, category: 'metadata' });
      }
    }
  });

  // Handle line items
  let lineItems: ExtractedLineItem[] = [];
  const rawItems = extracted.line_items || extracted.lineItems || [];
  if (Array.isArray(rawItems)) {
    lineItems = rawItems.map((item: any) => ({
      description: item.description || item.name || 'Unknown Item',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unit_price || item.unitPrice || item.price || 0),
      total: Number(item.total || item.amount || (Number(item.quantity || 1) * Number(item.unit_price || item.unitPrice || item.price || 0)) || 0)
    }));
  }

  // File type inference
  let fileType = backendDoc.document_type || 'unknown';
  if (extracted.invoice_number) fileType = 'invoice';
  
  return {
    id: backendDoc.id,
    fileName: backendDoc.file_name,
    fileType: fileType,
    uploadedAt: backendDoc.created_at,
    status: statusMap[backendDoc.status] || 'processing',
    summary: extracted.summary || (backendDoc.status === 'done' ? 'Document processed successfully.' : 'Processing...'),
    vendorName: extracted.vendor_name || extracted.vendorName,
    documentDate: extracted.date || extracted.documentDate,
    documentNumber: extracted.invoice_number || extracted.documentNumber,
    totalAmount: extracted.total_amount || extracted.totalAmount || 0,
    currency: extracted.currency || 'INR',
    fields,
    lineItems,
    rawText: JSON.stringify(extracted, null, 2)
  };
}

export async function fetchAllDocuments(): Promise<ExtractedDocument[]> {
  try {
    const { data, error } = await _supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapBackendDocToFrontend);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export async function deleteDocumentFromServer(id: string): Promise<{ ok: boolean; error?: string }> {
  // Try the backend first (it also removes from Storage); fall back to DB-only delete.
  try {
    const res = await fetch(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(5000) });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.detail || `Server error ${res.status}` };
  } catch {
    // Backend unreachable — delete the DB record directly via Supabase
    try {
      const { error } = await _supabase.from('documents').delete().eq('id', id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Delete failed' };
    }
  }
}

export async function uploadAndProcessDocument(file: File): Promise<ExtractedDocument | null> {
  // 1. Upload file to Supabase Storage via backend
  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.detail || 'Upload to storage failed');
  }
  const uploadData = await uploadRes.json();
  const docId = uploadData.document_id;

  // 2. Trigger AI extraction
  const processRes = await fetch(`${API_BASE_URL}/documents/process/${docId}`, {
    method: 'POST',
  });

  if (!processRes.ok) {
    const err = await processRes.json().catch(() => ({}));
    const detail = err.detail || 'AI processing failed';

    // Return the uploaded-but-failed document so the user can see it (and delete it)
    // Re-fetch the record from the server so status='failed' is reflected
    const docs = await fetchAllDocuments();
    const failedDoc = docs.find(d => d.id === docId);
    if (failedDoc) return failedDoc;

    throw new Error(detail);
  }

  const processData = await processRes.json();
  return mapBackendDocToFrontend({
    id: docId,
    file_name: file.name,
    document_type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'unknown',
    created_at: new Date().toISOString(),
    status: 'done',
    extracted_data: processData.extracted_data,
  });
}

export function exportToCSV(doc: ExtractedDocument): string {
  const lines: string[] = [];
  
  // Header fields
  lines.push('Category,Field,Value,Confidence');
  doc.fields.forEach(f => {
    lines.push(`${f.category},"${f.key}","${f.value}",${(f.confidence * 100).toFixed(0)}%`);
  });
  
  lines.push('');
  lines.push('Description,Quantity,Unit Price,Total');
  doc.lineItems.forEach(item => {
    lines.push(`"${item.description}",${item.quantity},₹${item.unitPrice.toFixed(2)},₹${item.total.toFixed(2)}`);
  });
  
  return lines.join('\n');
}

export function exportToJSON(doc: ExtractedDocument): string {
  return JSON.stringify({
    documentType: doc.fileType,
    documentNumber: doc.documentNumber,
    date: doc.documentDate,
    vendor: doc.vendorName,
    total: doc.totalAmount,
    currency: doc.currency,
    fields: doc.fields.reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {}),
    lineItems: doc.lineItems,
  }, null, 2);
}

export async function draftInvoiceWithAI(prompt: string): Promise<ExtractedLineItem[]> {
  const res = await fetch(`${API_BASE_URL}/invoice/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    if (res.status === 429) {
      throw new Error('AI quota exceeded. Please try again in a moment.');
    }
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  const items: ExtractedLineItem[] = (data.lineItems || []).map((item: any) => ({
    description: String(item.description || ''),
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    total: Number(item.total) || 0,
  }));

  return items;
}
