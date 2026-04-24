// @ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CompanySettings } from './SettingsPanel';
import { ExtractedLineItem } from '../../services/documentService';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: '#1a1a1a',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#7663b0',
  },
  logoImg: { width: 72, height: 72, objectFit: 'contain' },
  logoPlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#f3f0f8',
    borderRadius: 8,
  },
  companyBlock: { alignItems: 'flex-end', maxWidth: '55%' },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#7663b0',
    marginBottom: 4,
  },
  companyMeta: { fontSize: 9, color: '#666', marginBottom: 2, textAlign: 'right' },

  /* ── Invoice Title ── */
  invoiceTitle: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    letterSpacing: 2,
    marginBottom: 24,
  },

  /* ── Bill To / Meta row ── */
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  billBlock: { width: '50%' },
  metaBlock: { width: '42%', alignItems: 'flex-end' },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9e9e9e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  billName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 3 },
  billAddress: { fontSize: 9, color: '#555', lineHeight: 1.5 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
  metaLabel: { fontSize: 9, color: '#999', width: 60, textAlign: 'right', marginRight: 8 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111', width: 80, textAlign: 'right' },

  /* ── Table ── */
  table: { marginBottom: 28 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f0f8',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#7663b0',
  },
  colHeader: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#7663b0' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tableRowAlt: { backgroundColor: '#faf9ff' },
  colCell: { fontSize: 9, color: '#333' },
  colDesc: { width: '42%' },
  colQty: { width: '18%', textAlign: 'right' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  /* ── Totals ── */
  totalsLayout: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 32 },
  totalsBox: { width: '42%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  totalLabel: { fontSize: 9, color: '#666' },
  totalValue: { fontSize: 9, color: '#333' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderTopWidth: 2,
    borderTopColor: '#7663b0',
    marginTop: 4,
  },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#7663b0' },
  grandValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#7663b0' },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#aaa' },

  /* ── Status Badge ── */
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f0f8',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  badgeText: { fontSize: 8, color: '#7663b0', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
});

interface InvoicePDFProps {
  settings: CompanySettings;
  clientName: string;
  clientAddress: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: ExtractedLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

const fmt = (n: number) => {
  const safe = isNaN(n) || !isFinite(n) ? 0 : n;
  return `₹${safe.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const InvoicePDF: React.FC<InvoicePDFProps> = ({
  settings, clientName, clientAddress, invoiceNumber,
  issueDate, dueDate, items, subtotal, taxRate, taxAmount, total,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Header */}
      <View style={styles.header}>
        {settings.logo ? (
          <Image src={settings.logo} style={styles.logoImg} />
        ) : (
          <View style={styles.logoPlaceholder} />
        )}
        <View style={styles.companyBlock}>
          <Text style={styles.companyName}>{settings.companyName || 'Your Company'}</Text>
          {!!settings.address && (
            <Text style={styles.companyMeta}>{settings.address}</Text>
          )}
          {!!settings.taxId && (
            <Text style={styles.companyMeta}>Tax ID: {settings.taxId}</Text>
          )}
        </View>
      </View>

      {/* Invoice label + status */}
      <Text style={styles.invoiceTitle}>INVOICE</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>UNPAID</Text>
      </View>

      {/* Bill To + Meta */}
      <View style={styles.billRow}>
        <View style={styles.billBlock}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.billName}>{clientName || 'Client Name'}</Text>
          <Text style={styles.billAddress}>{clientAddress || '—'}</Text>
        </View>
        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoiceNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{issueDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{dueDate}</Text>
          </View>
        </View>
      </View>

      {/* Line items table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, styles.colDesc]}>Description</Text>
          <Text style={[styles.colHeader, styles.colQty]}>Qty</Text>
          <Text style={[styles.colHeader, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.colHeader, styles.colTotal]}>Amount</Text>
        </View>
        {items.map((item, i) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unitPrice) || 0;
          const rowTotal = Number(item.total) || qty * price;
          return (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.colCell, styles.colDesc]}>{item.description || '—'}</Text>
              <Text style={[styles.colCell, styles.colQty]}>{qty}</Text>
              <Text style={[styles.colCell, styles.colPrice]}>{fmt(price)}</Text>
              <Text style={[styles.colCell, styles.colTotal]}>{fmt(rowTotal)}</Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View style={styles.totalsLayout}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate || 0}%)</Text>
            <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandLabel}>Total Due</Text>
            <Text style={styles.grandValue}>{fmt(total)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {settings.companyName || 'Your Company'} · {settings.address ? settings.address.split('\n')[0] : ''}
        </Text>
        <Text style={styles.footerText}>Thank you for your business!</Text>
      </View>

    </Page>
  </Document>
);

export default InvoicePDF;
