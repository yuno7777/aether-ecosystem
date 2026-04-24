// @ts-nocheck
"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Fingerprint, Target, Eye, Heart, Sparkles, Users, MapPin } from 'lucide-react';
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

export function AboutPage() {
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
                            About Aether
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">
                        We build<br /><span className="text-[#7663b0]">-</span>clarity.
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Born from a vision to eliminate supply chain opacity. We build the data pipelines and AI brains that let modern companies move at the speed of intelligence.
                    </p>
                </motion.div>
            </section>

            {/* Mission & Vision */}
            <motion.section {...fadeIn} whileInView="animate" className="py-24 px-4 w-full max-w-7xl mx-auto border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center border border-[#7663b0]/20">
                                <Target className="w-5 h-5 text-[#7663b0]" />
                            </div>
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Our Mission</h3>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-[1.1]">
                            Democratize supply chain intelligence.
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Supply chain management shouldn't require a team of data scientists. Aether brings enterprise-grade AI forecasting, anomaly detection, and operational analytics to every business — from solo founders to global enterprises. We believe that when every company can see their supply chain clearly, the entire economy benefits.
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center border border-[#7663b0]/20">
                                <Eye className="w-5 h-5 text-[#7663b0]" />
                            </div>
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Our Vision</h3>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-[1.1]">
                            A world without supply chain surprises.
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            We envision a future where disruptions are predicted before they happen, where warehouses optimize themselves, and where every link in the supply chain communicates in real time. Aether is building the neural network of global commerce — one intelligent connection at a time.
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* Values Section */}
            <section className="py-20 px-4 w-full max-w-7xl mx-auto">
                <motion.div {...fadeIn} whileInView="animate" className="mb-16">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none">
                        Our<br /><span className="text-[#7663b0]">-</span>Values
                    </h2>
                </motion.div>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    {[
                        { icon: <Sparkles className="w-5 h-5" />, title: 'Intelligence First', desc: 'Every feature we build starts with AI at its core. We don\'t add intelligence as an afterthought — it\'s the foundation.' },
                        { icon: <Eye className="w-5 h-5" />, title: 'Radical Transparency', desc: 'Your data, your insights, your control. We believe opacity is the enemy of efficiency in modern supply chains.' },
                        { icon: <Heart className="w-5 h-5" />, title: 'Crafted Quality', desc: 'We obsess over the details. From sub-15ms API responses to pixel-perfect dashboards, quality is non-negotiable.' },
                        { icon: <Users className="w-5 h-5" />, title: 'Human-Centered', desc: 'Technology should empower people, not replace them. Our tools amplify human decision-making with machine precision.' },
                    ].map((value, i) => (
                        <motion.div key={i} variants={staggerItem} className="rounded-2xl bg-[#111113] border border-white/5 p-6 flex flex-col gap-4 group hover:bg-[#161619] transition-all hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center text-[#7663b0] border border-[#7663b0]/20">
                                {value.icon}
                            </div>
                            <h4 className="text-base font-semibold">{value.title}</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">{value.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Numbers Strip */}
            <motion.section {...fadeIn} whileInView="animate" className="py-12 border-t border-b border-white/10 w-full max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <p className="text-3xl font-bold text-[#7663b0] mb-1">2026</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Founded</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-[#7663b0] mb-1">12+</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Warehouses Tracked</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-[#7663b0] mb-1">99.9%</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Platform Uptime</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-[#7663b0] mb-1">&lt; 15ms</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Average Latency</p>
                </div>
            </motion.section>

            {/* Location Section */}
            <section className="py-24 px-4 w-full bg-black border-t border-white/10">
                <motion.div {...fadeIn} whileInView="animate" className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
                    <div className="md:w-1/2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center border border-[#7663b0]/20">
                                <MapPin className="w-5 h-5 text-[#7663b0]" />
                            </div>
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Headquarters</h3>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-none">
                            Mumbai<span className="text-[#7663b0]">,</span><br />India.
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-md mb-8">
                            Based in the financial heart of India, Aether Supply is strategically positioned to serve the rapidly growing logistics and supply chain ecosystem of South Asia while maintaining a global perspective on commerce intelligence.
                        </p>
                        <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors">
                            Get in Touch <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="md:w-1/2">
                        <div className="rounded-2xl bg-[#111113] border border-white/5 p-8 space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-sm text-gray-400">Email</span>
                                <a href="mailto:info@aethersupply.com" className="text-sm font-medium text-white hover:text-[#7663b0] transition-colors">info@aethersupply.com</a>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-sm text-gray-400">Location</span>
                                <span className="text-sm font-medium text-white">Mumbai, Maharashtra</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-sm text-gray-400">Platform</span>
                                <span className="text-sm font-medium text-white">Aether V2.0</span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="text-sm text-gray-400">Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    <span className="text-sm font-medium text-purple-400">Operational</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
