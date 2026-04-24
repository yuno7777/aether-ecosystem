// @ts-nocheck
"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, Cpu, Globe, Shield, Zap, BarChart3, ArrowRight, Settings } from 'lucide-react';
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

export function PlatformPage() {
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
                            Platform Architecture
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">
                        Built for<br /><span className="text-[#7663b0]">-</span>scale.
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Aether operates on a globally distributed edge network, delivering sub-15ms latency for critical logistics updates, powered by Gemini AI for intelligent forecasting and anomaly detection.
                    </p>
                </motion.div>
            </section>

            {/* Architecture Cards */}
            <section className="py-20 px-4 w-full max-w-7xl mx-auto">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {[
                        { icon: <Globe className="w-6 h-6" />, title: 'Edge Network', desc: 'Globally distributed nodes ensure data flows with minimal latency. Our edge compute fabric processes inventory updates in real time across 12+ warehouse locations.', stat: '< 15ms' },
                        { icon: <Cpu className="w-6 h-6" />, title: 'Gemini AI Core', desc: 'Google\'s Gemini powers our demand forecasting engine, achieving 98% accuracy by analyzing historical patterns, market signals, and seasonal trends.', stat: '98% ACC' },
                        { icon: <Shield className="w-6 h-6" />, title: 'Anomaly Defense', desc: 'Proactive detection of supply chain disruptions, stock irregularities, and demand spikes. Automated alerts before problems cascade.', stat: 'Real-time' },
                    ].map((card, i) => (
                        <motion.div key={i} variants={staggerItem} className="rounded-2xl bg-[#111113] border border-white/5 p-8 flex flex-col gap-6 group hover:bg-[#161619] transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-full bg-[#7663b0]/10 flex items-center justify-center text-[#7663b0] border border-[#7663b0]/20">
                                {card.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-2xl font-bold text-[#7663b0]">{card.stat}</span>
                                <span className="text-[10px] text-gray-600 uppercase tracking-widest">Performance</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Technical Stack Section */}
            <motion.section {...fadeIn} whileInView="animate" className="py-24 px-4 w-full max-w-7xl mx-auto border-t border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-16">
                    <div className="md:w-1/2">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-none">
                            Technical<br /><span className="text-[#7663b0]">-</span>Stack
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                            Every layer of Aether is designed for resilience, speed, and intelligence. From the serverless compute layer to the AI inference pipeline, we optimize for zero downtime.
                        </p>
                    </div>
                    <div className="md:w-1/2 space-y-0 border-t border-white/5 w-full">
                        {[
                            { layer: 'Frontend', tech: 'React + TypeScript', detail: 'Vite build, TailwindCSS' },
                            { layer: 'Auth', tech: 'Clerk', detail: 'OAuth 2.0, SSO' },
                            { layer: 'Database', tech: 'Neon PostgreSQL', detail: 'Serverless, Edge-ready' },
                            { layer: 'AI Engine', tech: 'Google Gemini', detail: 'Forecasting, NLP' },
                            { layer: 'Hosting', tech: 'Edge Network', detail: 'Global CDN, <15ms' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-5 px-2 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <span className="text-sm font-semibold text-white w-32">{item.layer}</span>
                                <span className="text-sm text-gray-300">{item.tech}</span>
                                <span className="text-xs text-gray-500">{item.detail}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Integrations Row */}
            <motion.section {...fadeIn} whileInView="animate" className="py-12 border-t border-b border-white/10 w-full max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">API Protocol</p>
                    <p className="text-lg font-medium">REST + GraphQL</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Auth Standard</p>
                    <p className="text-lg font-medium">OAuth 2.0 / JWT</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Data Format</p>
                    <p className="text-lg font-medium">JSON / Protobuf</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Uptime SLA</p>
                    <p className="text-lg font-medium">99.9%</p>
                </div>
            </motion.section>

            {/* CTA Section */}
            <section className="py-32 px-4 w-full bg-black">
                <motion.div {...fadeIn} whileInView="animate" className="max-w-7xl mx-auto text-center">
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                        Ready to<br /><span className="text-[#7663b0]">-</span>deploy?
                    </h2>
                    <p className="text-sm text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed">
                        Get started with Aether Supply in minutes. Connect your warehouse data, configure your AI modules, and watch your supply chain transform.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors">
                        Get Started <ArrowRight className="w-4 h-4" />
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
