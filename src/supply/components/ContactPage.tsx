// @ts-nocheck
"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-purple-500/30">
            <nav className="fixed top-8 left-8 z-50">
                <Link href="/" className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 text-sm font-medium text-gray-300 hover:text-white transition-all backdrop-blur-md">
                    <ArrowLeft className="w-4 h-4" /> Back to Aether
                </Link>
            </nav>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-center z-10 px-4"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-[#7663b0]/10 flex items-center justify-center border border-[#7663b0]/20">
                        <Mail className="w-8 h-8 text-[#7663b0]" />
                    </div>
                </div>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-none">
                    <span className="text-[#7663b0]">Contact</span> Us
                </h1>
                <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed mb-10">
                    Ready to transform your logistics? Let our engineers run a free diagnostic on your current supply chain architecture.
                </p>

                <a href="mailto:info@aethersupply.com" className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors">
                    info@aethersupply.com
                </a>
            </motion.div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
}
