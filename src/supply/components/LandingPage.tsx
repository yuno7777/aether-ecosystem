// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';
import { Settings, ArrowRight, Search, Plus, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const fadeIn = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
    }
};

export function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Platform', path: '/platform' },
        { name: 'Solutions', path: '/solutions' },
        { name: 'About Us', path: '/about' }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-sans overflow-x-hidden selection:bg-purple-500/30" style={{ transform: 'translateZ(0)' }}>

            {/* Navbar (Glassmorphism Pill) */}
            <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${scrolled ? 'w-[95%] max-w-7xl' : 'w-[90%] max-w-6xl'}`}>
                <div className="flex items-center justify-between px-6 py-3 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl">
                    <Link href="/" className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 opacity-90">
                                <Settings className="w-5 h-5" />
                                <Settings className="w-3 h-3 -ml-1" />
                            </div>
                            <span className="font-bold tracking-tight">Aether Supply</span>
                        </div>

                    </Link>

                    <div className="hidden md:flex items-center gap-1 bg-white/[0.04] rounded-full p-1 border border-white/5">
                        {navLinks.map((item, i) => (
                            <Link key={item.name} href={item.path} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${i === 0 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/contact" className="hidden sm:block px-4 py-2 rounded-full text-xs font-medium text-gray-300 hover:text-white transition-colors">
                            Contact
                        </Link>
                        <Link href="/login" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
                            Dashboard <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button
                            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-32 pb-20 px-4">
                {/* Giant Background Text */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none z-0"
                >
                    <h1 className="text-[15vw] md:text-[18vw] font-bold text-white/[0.02] tracking-tighter leading-none select-none">
                        AETHER
                    </h1>
                </motion.div>

                {/* Hero Content aligned like reference */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="w-full max-w-7xl relative z-10 flex flex-col md:flex-row items-end justify-between gap-10 mt-10 md:mt-20"
                >
                    <div className="w-full md:w-1/2">
                        <motion.h2 variants={staggerItem} className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.1] mb-6">
                            Are you<br />
                            <span className="text-gray-400">looking for</span><span className="text-[#7663b0]">-</span><br />
                            a <span className="text-white">smarter</span><br />
                            <span className="text-[#7663b0]">-</span>supply chain?
                        </motion.h2>

                        <motion.div variants={staggerItem} className="relative max-w-md mb-8 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#7663b0] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search solutions..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-full text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#7663b0]/50 focus:bg-white/[0.05] transition-all"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <ArrowRight className="w-4 h-4 text-black" />
                            </button>
                        </motion.div>

                        <motion.p variants={staggerItem} className="text-sm text-gray-400 leading-relaxed max-w-md opacity-80">
                            With its intelligent forecasting, anomaly detection, and real-time absolute visibility, Aether not only offers amazing control over logistics, but also an exceptionally harmonious operational flow.
                        </motion.p>
                    </div>

                    {/* Hero Feature Image/Card replacing the house */}
                    <motion.div variants={staggerItem} className="w-full md:w-[45%] rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden group" style={{ willChange: 'transform, opacity' }}>
                        <div className="absolute inset-0 bg-[#7663b0]/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">

                            <div className="flex justify-between items-start">
                                <div className="px-3 py-1 bg-[#7663b0]/20 text-[#7663b0] rounded-full text-[10px] font-bold tracking-wider uppercase">
                                    Live Dashboard
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            {/* Abstract Dashboard Graphic */}
                            <div className="my-auto w-full space-y-3">
                                <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                                <div className="flex gap-2 items-end h-24">
                                    {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-[#7663b0]/80 to-[#7663b0]/20 rounded-t-sm transition-all duration-700 hover:h-full" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Global Inventory Overview</h3>
                                <p className="text-xs text-gray-500">Real-time tracking across 12 warehouses</p>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>
            </section>

            {/* Grid Stats Section */}
            <section className="py-20 px-4 w-full max-w-7xl mx-auto">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid grid-cols-2 md:grid-cols-5 gap-4"
                >
                    {[
                        { num: '01', title: 'Demand Forecast', text: '98% Accuracy', val: 'GenAI' },
                        { num: '02', title: 'Global Reach', text: 'Warehouses', val: '12+' },
                        { num: '03', title: 'Processing', text: 'Orders/sec', val: '10k+' },
                        { num: '04', title: 'Uptime', text: 'Reliability', val: '99.9%' },
                        { num: '05', title: 'Integration', text: 'API Routes', val: 'REST' },
                    ].map((item, i) => (
                        <motion.div key={i} variants={staggerItem} className="relative aspect-[3/4] rounded-2xl bg-[#111113] border border-white/5 p-5 flex flex-col justify-between group hover:bg-[#161619] transition-all overflow-hidden hover:-translate-y-1">
                            <div className="absolute top-2 right-4 text-[80px] font-bold text-white/[0.03] group-hover:text-white/[0.05] transition-colors leading-none pointer-events-none">
                                {item.num}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-1">{item.title}</h4>
                                <p className="text-sm text-gray-300">{item.text}</p>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-semibold text-[#7663b0]">{item.val}</span>
                                <span className="text-[10px] text-gray-600">Active</span>
                            </div>
                        </motion.div>
                    ))}

                </motion.div>
            </section>

            {/* Typography & Mission */}
            <motion.section {...fadeIn} whileInView="animate" className="py-24 px-4 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 border-t border-white/10">
                <div>
                    <h2 className="text-5xl md:text-6xl font-medium tracking-tight leading-[1]">
                        Quality<br />
                        <span className="text-[#7663b0]">-</span>Velocity<br />
                        Intelligence
                    </h2>
                </div>
                <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7663b0]" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Work in Progress</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed mb-8">
                        Aether Supply focuses primarily on data accuracy, always aiming to apply the highest AI standards, creating pure value for its clients, with the aim of maintaining long-term resilient supply chains.
                    </p>
                    <Link href="/about" className="inline-block px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors">
                        Discover More
                    </Link>
                </div>
            </motion.section>

            {/* Data Row */}
            <motion.section {...fadeIn} whileInView="animate" className="py-12 border-t border-b border-white/10 w-full max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Platform Version</p>
                    <p className="text-lg font-medium">Aether V2.0</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Location</p>
                    <p className="text-lg font-medium">Global Network, Edge Compute</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Year</p>
                    <p className="text-lg font-medium">2026</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Latency</p>
                    <p className="text-lg font-medium">&lt; 15ms Avg</p>
                </div>
            </motion.section>

            {/* Dark Module List Section */}
            <section className="py-32 px-4 w-full bg-black">
                <motion.div {...fadeIn} whileInView="animate" className="max-w-7xl mx-auto">

                    <div className="flex justify-between items-end mb-16">
                        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter">
                            Control your
                        </h2>
                        <div className="flex items-center gap-2 pb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#7663b0]" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Modules</span>
                        </div>
                    </div>

                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="space-y-0 relative border-t border-white/5">
                        {[
                            { name: 'Products Catalog', desc: 'Centralized SKU Management', val: '14,024 items' },
                            { name: 'Supplier Management', desc: 'Contact & Lead Time Tracking', val: '280 active' },
                            { name: 'Transfer Logistics', desc: 'Warehouse Routing Protocol', val: 'Optimal' },
                            { name: 'AI Forecast Engine', desc: 'Gemini-powered Analytics', val: 'Active', highlight: true },
                            { name: 'Anomaly Defense', desc: 'Automated Issue Detection', val: 'Guarded' },
                        ].map((row, i) => (
                            <motion.div
                                variants={staggerItem}
                                key={i}
                                className={`group flex items-center justify-between py-6 px-4 border-b border-white/5 transition-colors cursor-pointer hover:bg-white/[0.02] ${row.highlight ? 'bg-[#7663b0] text-black hover:bg-[#9333ea]' : ''}`}
                            >
                                <div className="flex gap-20 w-1/2">
                                    <span className={`text-sm font-semibold w-60 ${row.highlight ? 'text-black' : 'text-white'}`}>{row.name}</span>
                                    <span className={`text-xs ${row.highlight ? 'text-black/70' : 'text-gray-500'}`}>{row.desc}</span>
                                </div>
                                <span className={`text-xs ${row.highlight ? 'text-black/90 font-bold' : 'text-gray-400'}`}>{row.val}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="mt-20 flex flex-col md:flex-row justify-between items-end">
                        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-10 md:mb-0">
                            Enjoy the peace of mind knowing your entire supply chain is monitored by advanced intelligence. Discover operational secrets, exploring hidden efficiencies and robust pathways.
                        </p>
                        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-right">
                            <span className="text-[#7663b0]">-</span>entire chain.
                        </h2>
                    </div>
                </motion.div>
            </section>

            {/* Deep Footer */}
            <motion.footer {...fadeIn} whileInView="animate" className="pt-20 pb-10 px-4 w-full bg-black border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col">

                    <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-20">
                        <span>Aether</span>
                        <span>Speed | Efficiency | Intelligence</span>
                        <span>Menu</span>
                    </div>

                    <div className="w-full text-center mb-20">
                        <a href="mailto:info@aethersupply.com" className="text-3xl md:text-5xl font-medium text-white hover:text-[#7663b0] transition-colors">
                            info@aethersupply.com
                        </a>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center text-[9px] font-bold tracking-widest uppercase text-gray-600 mb-24">
                        <div className="flex flex-col md:flex-row gap-2 md:gap-8 items-center">
                            <span>All rights reserved</span>
                            <span>© 2026 Aether</span>
                        </div>
                        <span>Mumbai, India</span>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Twitter</a>
                            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        </div>
                    </div>

                    <div className="w-full flex justify-center pb-8 pt-4">
                        <h1 className="text-[12vw] font-bold text-[#7663b0] tracking-tighter leading-tight select-none opacity-90 whitespace-nowrap">
                            aether supply
                        </h1>
                    </div>
                </div>
            </motion.footer>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed inset-0 z-[100] bg-[#0a0a0c]/95 backdrop-blur-3xl flex flex-col pt-8 px-6"
                    >
                        <div className="flex items-center justify-between mb-16">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 opacity-90">
                                    <Settings className="w-5 h-5 text-white" />
                                    <Settings className="w-3 h-3 -ml-1 text-white" />
                                </div>
                                <span className="font-bold tracking-tight text-white">Aether Supply</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-8 items-center">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-3xl font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <Link
                                href="/contact"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-3xl font-medium text-gray-300 hover:text-white transition-colors mt-4"
                            >
                                Contact
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="mt-8 flex items-center gap-2 px-8 py-4 rounded-full text-xl font-semibold bg-[#7663b0] text-black hover:bg-[#8b5cf6] transition-all"
                            >
                                Dashboard <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
