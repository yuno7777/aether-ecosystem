// @ts-nocheck
"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ProductAnalytics, StockStatus } from '../types';
import { AlertTriangle, DollarSign, Package, TrendingUp, Activity } from 'lucide-react';
import { ExportButton, CSVIcon, PDFIcon } from './ExportButton';
import { exportInventoryCSV, exportToPDF, generateInventoryReport } from '../services/exportService';

interface DashboardProps {
  analytics: ProductAnalytics[];
  totalValue: number;
}

// Adjusted colors for Dark Theme
const COLORS = ['#94a3b8', '#eab308', '#ef4444', '#3b82f6']; // Normal (Slate), Low (Yellow), Critical (Red), Overstock (Blue)

export const Dashboard: React.FC<DashboardProps> = ({ analytics, totalValue }) => {
  const stockStatusData = [
    { name: 'Normal', value: analytics.filter(a => a.status === StockStatus.NORMAL).length, color: COLORS[0] },
    { name: 'Low', value: analytics.filter(a => a.status === StockStatus.LOW).length, color: COLORS[1] },
    { name: 'Critical', value: analytics.filter(a => a.status === StockStatus.CRITICAL).length, color: COLORS[2] },
    { name: 'Overstocked', value: analytics.filter(a => a.status === StockStatus.OVERSTOCKED).length, color: COLORS[3] },
  ];

  const stockLevelData = analytics.slice(0, 10).map(a => ({
    name: a.product.name.length > 12 ? a.product.name.substring(0, 12) + '...' : a.product.name,
    stock: a.product.stock,
    reorder: a.product.reorderLevel
  }));

  const exportOptions = [
    { label: 'Export CSV', icon: <CSVIcon />, action: () => exportInventoryCSV(analytics) },
    {
      label: 'Export PDF', icon: <PDFIcon />, action: () => {
        const reportContent = generateInventoryReport(analytics);
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          reportWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Inventory Report - Aether Supply</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
              h1, h2 { margin-top: 24px; }
              table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
              th { background: #f5f5f5; font-weight: 600; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
              @media print { button { display: none !important; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div><h1 style="margin:0;">Inventory Report</h1><p>Generated: ${new Date().toLocaleString()}</p></div>
              <div><strong>Aether Supply</strong><br>Inventory Intelligence</div>
            </div>
            ${reportContent}
          </body>
          </html>
        `);
          reportWindow.document.close();
          reportWindow.onload = () => reportWindow.print();
        }
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Inventory Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time stock levels and analytics</p>
        </div>
        <ExportButton options={exportOptions} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: analytics.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Inventory Value', value: `₹${totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Low/Critical Stock', value: analytics.filter(a => a.status === StockStatus.LOW || a.status === StockStatus.CRITICAL).length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Reorder Suggestions', value: analytics.filter(a => a.suggestedReorderQty > 0).length, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm hover:border-border/80 transition-all">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2 text-foreground">
              <Activity className="w-4 h-4 text-primary" />
              Stock Levels vs Reorder Point
            </h3>
            <p className="text-sm text-muted-foreground">Top 10 products overview</p>
          </div>
          <div className="p-6 pt-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockLevelData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                <XAxis
                  dataKey="name"
                  stroke="#525252"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#d4d4d4' }}
                />
                <YAxis
                  stroke="#525252"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  tick={{ fill: '#d4d4d4' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#a3a3a3' }}
                  cursor={{ fill: '#262626' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', color: '#d4d4d4' }}
                />
                <Bar dataKey="stock" name="Current Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reorder" name="Reorder Level" fill="#525252" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight text-foreground">Inventory Status Distribution</h3>
            <p className="text-sm text-muted-foreground">Current health breakdown</p>
          </div>
          <div className="p-6 pt-0 h-[300px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ color: '#d4d4d4' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};