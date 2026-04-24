"use client";
import React, { useEffect, useState } from 'react';
import { ArrowRight, Search, Menu, X, Users, Package, FileText, Calculator, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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

const fadeIn = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const }
};

export default function LandingPage() {
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
    { name: 'Supply Chain', path: '/supply' },
    { name: 'CRM', path: '/crm' },
    { name: 'Documents', path: '/documents' },
    { name: 'Tax', path: '/tax' },
    { name: 'SDR Agent', path: '/sdr' },
    { name: 'Comm. Agent', path: '/commerce' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans overflow-x-hidden selection:bg-purple-500/30" style={{ transform: 'translateZ(0)' }}>

      {/* Navbar */}
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${scrolled ? 'w-[95%] max-w-7xl' : 'w-[90%] max-w-6xl'}`}>
        <div className="flex items-center justify-between px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl">
          <Link href="/" className="flex items-center gap-2 ml-[2%]">
            <img src="/logo.png" alt="Aether" width={44} height={44} className="w-[44px] h-[44px] object-contain" />
            <span className="text-xl font-bold tracking-tight">Aether</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 bg-white/[0.04] rounded-full p-1 border border-white/5">
            {navLinks.map((item, i) => (
              <Link key={item.name} href={item.path} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${i === 0 ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/supply" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
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
      <section className="relative min-h-[80vh] flex flex-col items-center justify-start pt-28 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-[12%] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none z-0"
        >
          <h1 className="text-[15vw] md:text-[18vw] font-bold text-white/[0.02] tracking-tighter leading-none select-none">
            AETHER
          </h1>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="w-full max-w-7xl relative z-10 flex flex-col items-center text-center gap-8 mt-6 md:mt-10"
        >
          <motion.h2 variants={staggerItem} className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.1]">
            One Platform<span className="text-[#7663b0]">.</span><br />
            <span className="text-gray-400">Six Powerhouses</span><span className="text-[#7663b0]">.</span>
          </motion.h2>

          <motion.p variants={staggerItem} className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl opacity-80">
            Aether unifies supply chain management, customer relationships, and intelligent document processing into a single platform. Choose your workspace below.
          </motion.p>

          {/* Powerhouse Grid Layout */}
          <motion.div variants={staggerItem} className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

            {/* Aether Supply Card */}
            <Link href="/supply" className="group">
              <div className="rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden hover:border-[#7663b0]/40 transition-all duration-500">
                <div className="absolute inset-0 bg-[#7663b0]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="px-3 py-1 bg-[#7663b0]/20 text-[#7663b0] rounded-full text-[10px] font-bold tracking-wider uppercase">
                      Supply Chain
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center group-hover:bg-[#7663b0]/20 transition-colors">
                      <Package className="w-5 h-5 text-[#7663b0]" />
                    </div>
                  </div>

                  <div className="my-auto w-full space-y-3">
                    <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                    <div className="flex gap-2 items-end h-24">
                      {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-[#7663b0]/80 to-[#7663b0]/20 rounded-t-sm transition-all duration-700 group-hover:opacity-100 opacity-60" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-[#7663b0] transition-colors">Aether Supply</h3>
                    <p className="text-xs text-gray-500">Inventory, forecasting, warehouses & suppliers</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* AetherCRM Card */}
            <Link href="/crm" className="group">
              <div className="rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden hover:border-purple-400/40 transition-all duration-500">
                <div className="absolute inset-0 bg-purple-400/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="px-3 py-1 bg-purple-400/20 text-purple-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      CRM
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center group-hover:bg-purple-400/20 transition-colors">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>

                  <div className="my-auto w-full space-y-3">
                    <div className="h-2 w-1/4 bg-white/20 rounded-full" />
                    <div className="grid grid-cols-4 gap-2 h-24">
                      {['Lead', 'Contact', 'Proposal', 'Won'].map((stage, i) => (
                        <div key={i} className="flex flex-col justify-end gap-1">
                          <div className="bg-gradient-to-t from-purple-400/80 to-purple-400/20 rounded-t-sm transition-all duration-700 group-hover:opacity-100 opacity-60" style={{ height: `${[35, 55, 40, 75][i]}%` }} />
                          <span className="text-[8px] text-gray-600 text-center">{stage}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">AetherCRM</h3>
                    <p className="text-xs text-gray-500">Clients, deals, pipeline & task management</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* AetherDocs Card */}
            <Link href="/documents" className="group">
              <div className="rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden hover:border-purple-400/40 transition-all duration-500">
                <div className="absolute inset-0 bg-purple-400/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="px-3 py-1 bg-purple-400/20 text-purple-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      Documents
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center group-hover:bg-purple-400/20 transition-colors">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>

                  <div className="my-auto w-full space-y-3">
                    <div className="h-2 w-1/5 bg-white/20 rounded-full" />
                    <div className="space-y-2">
                      {[85, 60, 95, 40, 75].map((w, i) => (
                        <div key={i} className="flex items-center gap-2 h-4">
                          <div className="w-3 h-3 rounded bg-purple-400/30 shrink-0" />
                          <div className="bg-gradient-to-r from-purple-400/40 to-purple-400/10 rounded-sm h-2 transition-all duration-700 group-hover:opacity-100 opacity-60" style={{ width: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">AetherDocs</h3>
                    <p className="text-xs text-gray-500">AI document extraction & processing pipeline</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* AetherTax Card */}
            <Link href="/tax" className="group">
              <div className="rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden hover:border-purple-400/40 transition-all duration-500">
                <div className="absolute inset-0 bg-purple-400/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="px-3 py-1 bg-purple-400/20 text-purple-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
                      Compliance
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center group-hover:bg-purple-400/20 transition-colors">
                      <Calculator className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>

                  <div className="my-auto w-full space-y-3">
                    <div className="h-2 w-1/4 bg-white/20 rounded-full" />
                    <div className="grid grid-cols-3 gap-2 h-24">
                      {[60, 90, 45].map((w, i) => (
                        <div key={i} className="flex flex-col justify-end gap-1">
                          <div className="bg-gradient-to-t from-purple-400/80 to-purple-400/20 rounded-t-sm transition-all duration-700 group-hover:opacity-100 opacity-60" style={{ height: `${w}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">AetherTax</h3>
                    <p className="text-xs text-gray-500">AI GST reconciliation, ITC tracking & alerts</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* AetherSDR Card */}
            <Link href="/sdr" className="group">
              <div className="rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden hover:border-[#7663b0]/40 transition-all duration-500 h-full">
                <div className="absolute inset-0 bg-[#7663b0]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start mb-6 md:mb-0">
                    <div className="px-3 py-1 bg-[#7663b0]/20 text-[#7663b0] rounded-full text-[10px] font-bold tracking-wider uppercase">
                      Sales Rep Agent
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center group-hover:bg-[#7663b0]/20 transition-colors">
                      <Bot className="w-5 h-5 text-[#7663b0]" />
                    </div>
                  </div>

                  <div className="my-auto w-full space-y-4 py-8">
                    <div className="h-2 w-24 bg-white/20 rounded-full" />
                    <div className="flex gap-3">
                         <div className="h-8 w-8 shrink-0 rounded-full bg-[#7663b0]/30 animate-pulse border border-[#7663b0]/50" />
                         <div className="space-y-1.5 flex-1">
                             <div className="h-2 w-1/3 bg-[#7663b0]/40 rounded mb-2" />
                             <div className="h-1.5 w-3/4 bg-white/10 rounded" />
                             <div className="h-1.5 w-1/2 bg-white/10 rounded" />
                         </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-[#7663b0] transition-colors">AetherSDR</h3>
                    <p className="text-xs text-gray-500">Autonomous prospecting, cold emails & scheduling</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Aether Commerce Card */}
            <Link href="/commerce" className="group">
              <div className="rounded-3xl p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden hover:border-[#7663b0]/40 transition-all duration-500 h-full">
                <div className="absolute inset-0 bg-[#7663b0]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.05] aspect-[4/3] flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start mb-6 md:mb-0">
                    <div className="px-3 py-1 bg-[#7663b0]/20 text-[#7663b0] rounded-full text-[10px] font-bold tracking-wider uppercase">
                      WhatsApp AI
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#7663b0]/10 flex items-center justify-center group-hover:bg-[#7663b0]/20 transition-colors text-lg">
                      💬
                    </div>
                  </div>

                  <div className="my-auto w-full space-y-3 py-4">
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-[#7663b0]/20 flex items-center justify-center"><span className="text-[10px]">🤖</span></div>
                       <div className="h-2 flex-1 max-w-[60%] bg-[#7663b0]/40 rounded-full rounded-tl-sm"/>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse">
                       <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center"><span className="text-[10px]">🙎</span></div>
                       <div className="h-2 flex-1 max-w-[40%] bg-white/10 rounded-full rounded-tr-sm"/>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-[#7663b0]/20 flex items-center justify-center"><span className="text-[10px]">🛒</span></div>
                       <div className="h-2 flex-1 max-w-[80%] bg-[#7663b0]/60 rounded-full rounded-tl-sm"/>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-[#7663b0] transition-colors">AetherCommerce</h3>
                    <p className="text-xs text-gray-500">Multilingual WhatsApp bot for catalog & UPI payments</p>
                  </div>
                </div>
              </div>
            </Link>

          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 w-full max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {[
            { num: '01', title: 'Demand Forecast', text: '98% Accuracy', val: 'GenAI' },
            { num: '02', title: 'CRM Pipeline', text: 'Deal Tracking', val: 'Real-time' },
            { num: '03', title: 'Doc Processing', text: 'AI Extraction', val: 'Gemini' },
            { num: '04', title: 'Auto-Reconciliation', text: 'GST Matching', val: 'Instant' },
            { num: '05', title: 'Integration', text: 'Unified Platform', val: 'REST' },
            { num: '06', title: 'Autonomous SDR', text: 'Top-Funnel Sales', val: 'Agentic' },
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

      {/* Mission Section */}
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
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Unified Platform</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            Aether brings together supply chain intelligence and customer relationship management. From demand forecasting to deal pipelines, manage your entire business from one place.
          </p>
          <Link href="/supply" className="inline-block px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors">
            Get Started
          </Link>
        </div>
      </motion.section>

      {/* Modules Section */}
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
              { name: 'Client Pipeline', desc: 'CRM Deal Tracking', val: 'Real-time' },
              { name: 'Supplier Management', desc: 'Contact & Lead Time Tracking', val: '280 active' },
              { name: 'Document Pipeline', desc: 'AI-Powered Data Extraction', val: 'Gemini', highlight: false },
              { name: 'GST & Compliance', desc: 'GSTR Reconciliations & Filing', val: 'Emerald', highlight: true },
              { name: 'AI SDR Agent', desc: 'Autonomous Outreach & Cadences', val: 'Active', highlight: false },
              { name: 'WhatsApp Commerce', desc: 'AI Customer Operations & UPI', val: 'Active', highlight: false },
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
              Enjoy the peace of mind knowing your entire business is monitored by advanced intelligence. From supply chain to CRM, everything in one place.
            </p>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-right">
              <span className="text-[#7663b0]">-</span>entire business.
            </h2>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer {...fadeIn} whileInView="animate" className="pt-20 pb-10 px-4 w-full bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-20">
            <span>Aether</span>
            <span>Supply · CRM · Documents · Tax · Intelligence · Commerce</span>
            <span>Menu</span>
          </div>

          <div className="w-full text-center mb-20">
            <a href="mailto:info@aether.com" className="text-3xl md:text-5xl font-medium text-white hover:text-[#7663b0] transition-colors">
              info@aether.com
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
              aether
            </h1>
          </div>
        </div>
      </motion.footer>

      {/* Mobile Menu */}
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
              <div className="flex items-center gap-2 ml-[2%]">
                <img src="/logo.png" alt="Aether" width={44} height={44} className="w-[44px] h-[44px] object-contain" />
                <span className="text-xl font-bold tracking-tight text-white">Aether</span>
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
                href="/supply"
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
