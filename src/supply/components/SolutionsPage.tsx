// @ts-nocheck
"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Package, Truck, BarChart3, Brain, ShoppingCart, Factory } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }
};

export function SolutionsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans overflow-x-hidden selection:bg-purple-500/30" style={{ transform: 'translateZ(0)' }}>

            {/* Back Navigation */}
            <nav className="fixed top-8 left-8 z-50">
                <Link href="/" className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 text-sm font-medium text-gray-300 hover:text-white transition-all backdrop-blur-md shadow-2xl">
                    <ArrowLeft className="w-4 h-4" /> Back to Aether
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[70vh] flex flex-col items-center justify-center pt-32 pb-20 px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center z-10 max-w-4xl"
                >
                    <div className="flex justify-center mb-8">
                        <div className="px-4 py-1.5 rounded-full bg-[#7663b0]/10 border border-[#7663b0]/20 text-[10px] font-bold tracking-[0.2em] uppercase text-[#7663b0]">
                            Industry Solutions
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">
                        Solutions for<br /><span className="text-[#7663b0]">-</span>every chain.
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        From enterprise retail to global manufacturing, our tailored intelligent modules orchestrate supply chains with precision across every industry vertical.
                    </p>
                </motion.div>
            </section>

            {/* Solutions Grid */}
            <section className="py-20 px-4 w-full max-w-7xl mx-auto">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {[
                        { icon: <ShoppingCart className="w-6 h-6" />, title: 'Retail & E-Commerce', desc: 'Optimize inventory across multiple storefronts and fulfillment centers. Predict seasonal demand, prevent stockouts, and automate reorder points with AI-driven insights.', features: ['Multi-channel sync', 'Seasonal forecasting', 'Auto-reorder'] },
                        { icon: <Factory className="w-6 h-6" />, title: 'Manufacturing', desc: 'Streamline raw material procurement and production scheduling. Track component availability, manage supplier lead times, and minimize production line downtime.', features: ['BOM tracking', 'Lead time optimization', 'Production planning'] },
                        { icon: <Truck className="w-6 h-6" />, title: 'Logistics & Distribution', desc: 'Coordinate warehouse operations, route transfers intelligently, and maintain real-time visibility across your entire distribution network with edge-compute tracking.', features: ['Route optimization', 'Warehouse operations', 'Real-time tracking'] },
                        { icon: <Package className="w-6 h-6" />, title: 'FMCG & Consumer Goods', desc: 'Handle high-velocity SKU management with expiry tracking, batch controls, and automated compliance reporting for fast-moving consumer goods.', features: ['Expiry management', 'Batch control', 'Compliance reports'] },
                    ].map((solution, i) => (
                        <motion.div key={i} variants={staggerItem} className="rounded-2xl bg-[#111113] border border-white/5 p-8 flex flex-col gap-6 group hover:bg-[#161619] transition-all hover:-translate-y-1">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-full bg-[#7663b0]/10 flex items-center justify-center text-[#7663b0] border border-[#7663b0]/20">
                                    {solution.icon}
                                </div>
                                <span className="text-[80px] font-bold text-white/[0.03] leading-none pointer-events-none -mt-4 -mr-2">0{i + 1}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">{solution.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{solution.desc}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                {solution.features.map((f, j) => (
                                    <span key={j} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/5 text-[10px] font-bold tracking-wider uppercase text-gray-400">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Capabilities Strip */}
            <section className="py-24 px-4 w-full bg-black border-t border-white/10">
                <motion.div {...fadeIn} whileInView="animate" className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-16">
                        <div className="md:w-1/2">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-none">
                                Core<br /><span className="text-[#7663b0]">-</span>Capabilities
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed max-w-md mb-8">
                                Every solution is built on our unified platform. These capabilities come standard, no matter your industry.
                            </p>
                        </div>

                        <div className="md:w-1/2 space-y-0 border-t border-white/5 w-full">
                            {[
                                { name: 'AI Demand Forecasting', desc: 'Gemini-powered predictions', status: 'Active' },
                                { name: 'Real-Time Tracking', desc: 'Live warehouse visibility', status: 'Active' },
                                { name: 'Automated Reordering', desc: 'Smart threshold triggers', status: 'Active' },
                                { name: 'Anomaly Detection', desc: 'Proactive disruption alerts', status: 'Active' },
                                { name: 'Multi-Warehouse Transfers', desc: 'Optimized routing logic', status: 'Active' },
                                { name: 'Analytics Dashboard', desc: 'Full operational insight', status: 'Active' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-5 px-2 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                    <span className="text-sm font-semibold text-white">{item.name}</span>
                                    <span className="text-xs text-gray-500 hidden md:block">{item.desc}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* CTA */}
            <section className="py-32 px-4 w-full bg-black">
                <motion.div {...fadeIn} whileInView="animate" className="max-w-7xl mx-auto text-center">
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                        Find your<br /><span className="text-[#7663b0]">-</span>solution.
                    </h2>
                    <p className="text-sm text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed">
                        No matter your industry, Aether adapts to your supply chain. Start with our intelligent dashboard and evolve as you scale.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors">
                        Start Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 w-full bg-black border-t border-white/10">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-[9px] font-bold tracking-widest uppercase text-gray-600">
                    <span>© 2026 Aether Supply</span>
                    <span>Mumbai, India</span>
                </div>
            </footer>
        </div>
    );
}
