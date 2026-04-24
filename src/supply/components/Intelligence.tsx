// @ts-nocheck
"use client";
import React, { useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ProductAnalytics, Sale } from '../types';
import { generateInventoryInsight, InventoryInsight } from '../services/geminiService';
import { Sparkles, TrendingUp, Zap, Loader2, BrainCircuit, RefreshCw, ArrowRight } from 'lucide-react';

interface IntelligenceProps {
  analytics: ProductAnalytics[];
  sales: Sale[];
}

export const Intelligence: React.FC<IntelligenceProps> = ({ analytics, sales }) => {
  const [insight, setInsight] = useState<InventoryInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate Smart Reorder Value (KPI)
  const smartReorderValue = useMemo(() => {
    return analytics.reduce((acc, item) => {
      return acc + (item.suggestedReorderQty * item.product.price);
    }, 0);
  }, [analytics]);

  // Generate Mock Forecast Data based on recent sales history
  const forecastData = useMemo(() => {
    // 1. Group past sales by date
    const salesByDate: Record<string, number> = {};
    const today = new Date();

    // Initialize last 14 days with 0
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      salesByDate[d.toISOString().split('T')[0]] = 0;
    }

    sales.forEach(sale => {
      const dateStr = String(sale.date).split('T')[0];
      if (salesByDate[dateStr] !== undefined) {
        salesByDate[dateStr] += sale.quantity;
      }
    });

    // 2. Create Chart Data Array
    const data = Object.keys(salesByDate).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      historical: salesByDate[date],
      forecast: null as number | null,
      confidence: [null, null] as [number, number] | [null, null]
    }));

    // 3. Add 7 days of forecast (Simple moving average projection + random noise for demo)
    const last5DaysAvg = Object.values(salesByDate).slice(-5).reduce((a, b) => a + b, 0) / 5;

    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const baseValue = last5DaysAvg * (1 + (Math.random() * 0.2 - 0.1)); // +/- 10%

      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        historical: null as any, // Cast to any to satisfy type overlap for chart
        forecast: Math.round(baseValue),
        confidence: [Math.round(baseValue * 0.8), Math.round(baseValue * 1.2)]
      });
    }

    return data;
  }, [sales]);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    const result = await generateInventoryInsight(analytics);
    if (result) {
      setInsight(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          Intelligence <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        </h1>
        <p className="text-muted-foreground mt-1">AI-powered forecasting and supply chain optimization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

        {/* Left Column: Inventory Copilot */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card shadow-lg flex flex-col min-h-[600px] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="p-6 flex-1 flex flex-col z-10">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2.5 bg-primary/20 rounded-lg shrink-0">
                <BrainCircuit className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground leading-tight">Inventory Copilot</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Generate comprehensive analysis of your stock health, supplier risks, and actionable optimization strategies using Gemini AI models.
                </p>
              </div>
            </div>

            {/* Content Area */}
            {!insight ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div className="max-w-xs text-sm text-muted-foreground">
                  Ready to analyze {analytics.length} SKUs across your supply chain network.
                </div>
                <button
                  onClick={handleGenerateInsights}
                  disabled={isLoading}
                  className="w-full relative overflow-hidden group flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-lg font-semibold shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Insights
                    </>
                  )}
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-full" />
                </button>
              </div>
            ) : (
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* Model Info Row */}
                <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-muted-foreground uppercase border-b border-border/50 pb-2">
                  <span>Model: Gemini-3-Flash</span>
                  <button onClick={handleGenerateInsights} disabled={isLoading} className="hover:text-primary transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Health Score Card */}
                <div className="rounded-lg bg-secondary/30 border border-border/50 p-5 shadow-inner">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Health Score</span>
                    <span className={`text-xl font-bold ${insight.healthScore > 70 ? 'text-purple-500' : insight.healthScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                      {insight.healthScore}/100
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-background rounded-full overflow-hidden border border-border/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${insight.healthScore > 70 ? 'bg-purple-500 text-purple-500' : insight.healthScore > 40 ? 'bg-amber-500 text-amber-500' : 'bg-red-500 text-red-500'}`}
                      style={{ width: `${insight.healthScore}%` }}
                    />
                  </div>
                </div>

                {/* Summary Quote */}
                <div className="relative pl-4 border-l-4 border-primary/60 py-1">
                  <p className="text-sm italic text-slate-300 leading-relaxed font-medium">
                    "{insight.summary}"
                  </p>
                </div>

                {/* Recommendations */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Recommendations</h4>
                  {insight.recommendations.map((rec, i) => (
                    <div key={i} className="group flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors shadow-sm">
                      <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      <p className="text-xs text-foreground leading-normal">{rec}</p>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Right Column: Charts & KPIs */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Main Chart Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex-1 min-h-[400px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Demand Forecast</h3>
                <p className="text-sm text-muted-foreground">Projected sales volume vs actuals (Next 7 Days)</p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Historical</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Forecast</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500/20"></span> Confidence</div>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis
                    dataKey="date"
                    stroke="#525252"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#a3a3a3' }}
                  />
                  <YAxis
                    stroke="#525252"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#a3a3a3' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626', color: '#fff' }}
                    itemStyle={{ color: '#e5e5e5' }}
                  />
                  {/* Confidence Interval (Area) */}
                  <Area
                    type="monotone"
                    dataKey="confidence"
                    stroke="none"
                    fill="#8b5cf6"
                    fillOpacity={0.1}
                  />
                  {/* Forecast Line (Dashed) */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4, fill: '#8b5cf6' }}
                  />
                  {/* Historical Area */}
                  <Area
                    type="monotone"
                    dataKey="historical"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHistorical)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Forecast Accuracy</p>
                  <h4 className="text-2xl font-bold text-foreground mt-2">94.2%</h4>
                  <span className="text-xs text-purple-400 font-medium mt-1 inline-flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> +1.4% vs last month
                  </span>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Smart Reorder Value</p>
                  <h4 className="text-2xl font-bold text-foreground mt-2">
                    ${smartReorderValue.toLocaleString()}
                  </h4>
                  <span className="text-xs text-muted-foreground mt-1">Pending approval</span>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};