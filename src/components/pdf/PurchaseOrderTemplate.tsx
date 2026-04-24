"use client";
// @ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const colors = {
  bg: '#0a0a0c',
  cardBg: '#111113',
  accent: '#7663b0',
  accentDim: '#7c3aed',
  text: '#ffffff',
  textMuted: '#9ca3af',
  border: '#1f1f23',
  warning: '#f59e0b',
};

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.accent,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 4,
  },
  docLabel: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'right',
  },
  docNumber: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metaBlock: {
    width: '48%',
  },
  metaLabel: {
    fontSize: 8,
    color: colors.accentDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: 600,
  },
  metaValue: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    padding: '10 14',
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '10 14',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colItem: { width: '35%' },
  colSku: { width: '20%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  termsSection: {
    marginBottom: 30,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 16,
  },
  termsLabel: {
    fontSize: 8,
    color: colors.accentDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: 600,
  },
  termsText: {
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 1.6,
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  totalsBox: {
    width: 220,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: 600,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.accentDim,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.accent,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
});

interface POItem {
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

interface POData {
  number: string;
  date: string;
  expectedDelivery: string;
  supplier: {
    name: string;
    email: string;
    location: string;
  };
  items: POItem[];
  terms?: string;
}

const formatCurrency = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function PurchaseOrderTemplate({ data }: { data: POData }) {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const shipping = 250;
  const total = subtotal + shipping;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>Aether</Text>
            <Text style={s.subtitle}>Supply Chain Module</Text>
          </View>
          <View>
            <Text style={s.docLabel}>PURCHASE ORDER</Text>
            <Text style={s.docNumber}>PO-{data.number}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Vendor</Text>
            <Text style={s.metaValue}>{data.supplier.name}</Text>
            <Text style={s.metaValue}>{data.supplier.location}</Text>
            <Text style={[s.metaValue, { color: colors.textMuted }]}>{data.supplier.email}</Text>
          </View>
          <View style={[s.metaBlock, { alignItems: 'flex-end' }]}>
            <Text style={s.metaLabel}>Order Details</Text>
            <Text style={s.metaValue}>Date: {data.date}</Text>
            <Text style={s.metaValue}>Expected: {data.expectedDelivery}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colItem]}>Item</Text>
            <Text style={[s.tableHeaderText, s.colSku]}>SKU</Text>
            <Text style={[s.tableHeaderText, s.colQty]}>Qty</Text>
            <Text style={[s.tableHeaderText, s.colPrice]}>Unit Cost</Text>
            <Text style={[s.tableHeaderText, s.colTotal]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[{ fontSize: 10, color: colors.text }, s.colItem]}>{item.name}</Text>
              <Text style={[{ fontSize: 9, color: colors.textMuted }, s.colSku]}>{item.sku}</Text>
              <Text style={[{ fontSize: 10, color: colors.textMuted }, s.colQty]}>{item.quantity}</Text>
              <Text style={[{ fontSize: 10, color: colors.textMuted }, s.colPrice]}>{formatCurrency(item.unitCost)}</Text>
              <Text style={[{ fontSize: 10, color: colors.text, fontWeight: 600 }, s.colTotal]}>{formatCurrency(item.quantity * item.unitCost)}</Text>
            </View>
          ))}
        </View>

        {/* Terms */}
        <View style={s.termsSection}>
          <Text style={s.termsLabel}>Terms & Conditions</Text>
          <Text style={s.termsText}>
            {data.terms || 'Standard procurement terms apply. Payment net 30 days from receipt of goods. Goods must meet quality specifications outlined in the supplier agreement. Defective items will be returned at vendor expense.'}
          </Text>
        </View>

        {/* Totals */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Shipping</Text>
              <Text style={s.totalValue}>{formatCurrency(shipping)}</Text>
            </View>
            <View style={s.grandTotal}>
              <Text style={s.grandTotalLabel}>Order Total</Text>
              <Text style={s.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Aether Supply | aether.io/supply</Text>
          <Text style={s.footerText}>Authorized Purchase Order</Text>
        </View>
      </Page>
    </Document>
  );
}
