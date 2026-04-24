// @ts-nocheck
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, ChevronDown, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { ChatMessage, sendChatMessage, getQuickActions, ChatContext, CRUDCallbacks, ExecutedAction } from '../services/chatService';
import { ProductAnalytics, Sale, Supplier, Product } from '../types';

interface AIChatbotProps {
    analytics: ProductAnalytics[];
    sales: Sale[];
    suppliers: Supplier[];
    onAddProduct?: (product: Omit<Product, 'id'>) => Promise<void>;
    onUpdateProduct?: (product: Product) => Promise<void>;
    onDeleteProduct?: (productId: string) => Promise<void>;
}

const ActionBadge: React.FC<{ action: ExecutedAction }> = ({ action }) => {
    const ok = action.status === 'success';
    return (
        <div className={`mt-1.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${ok
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
            {ok
                ? <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />
                : <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            }
            <span>{action.detail}</span>
        </div>
    );
};

export const AIChatbot: React.FC<AIChatbotProps> = ({
    analytics, sales, suppliers,
    onAddProduct, onUpdateProduct, onDeleteProduct
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatPanelRef = useRef<HTMLDivElement>(null);
    const floatingButtonRef = useRef<HTMLButtonElement>(null);

    const context: ChatContext = { analytics, sales, suppliers };
    const crudCallbacks: CRUDCallbacks = {
        addProduct: onAddProduct,
        updateProduct: onUpdateProduct,
        deleteProduct: onDeleteProduct,
    };
    const quickActions = getQuickActions();
    const crudSuggestions = ["Add 100 units to lowest stock item", "Delete a product from inventory"];

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollToBottom(); }, [messages]);
    useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!isOpen) return;
            const t = e.target as Node;
            if (!chatPanelRef.current?.contains(t) && !floatingButtonRef.current?.contains(t)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleSend = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;

        setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await sendChatMessage(msg, context, messages, crudCallbacks);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.text,
                timestamp: new Date(),
                action: result.action
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I ran into an error. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating trigger */}
            <button
                ref={floatingButtonRef}
                onClick={() => setIsOpen(v => !v)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all duration-200 ${
                    isOpen
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:scale-105 hover:shadow-purple-500/30'
                }`}
            >
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </button>

            {/* Panel */}
            <div
                ref={chatPanelRef}
                className={`fixed bottom-24 right-6 z-50 flex flex-col bg-[#111111] border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
                    isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
                }`}
                style={{ width: 400, height: 560 }}
            >
                {/* ── Header ── */}
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-950/60 to-indigo-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-tight">Inventory AI</p>
                            <p className="text-[10px] text-purple-300/70 leading-tight flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" /> Powered by Google GenAI
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Messages ── */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.length === 0 ? (
                        /* Empty state */
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/80">Inventory AI Assistant</p>
                                <p className="text-xs text-neutral-500 mt-1 max-w-[260px]">
                                    Ask questions or perform actions — update stock, add products, and more.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {[...quickActions, ...crudSuggestions].map((a, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(a)}
                                        className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-neutral-300 transition-colors"
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[80%]">
                                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                        msg.role === 'user'
                                            ? 'bg-purple-600 text-white rounded-br-sm'
                                            : 'bg-white/8 text-neutral-200 rounded-bl-sm border border-white/8'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    {msg.action && <ActionBadge action={msg.action} />}
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="px-3.5 py-2.5 bg-white/8 border border-white/8 rounded-2xl rounded-bl-sm flex items-center gap-2 text-neutral-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span className="text-xs">Thinking…</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ── Quick chips (when chat has messages) ── */}
                {messages.length > 0 && (
                    <div className="shrink-0 px-4 pb-2 flex gap-2 overflow-x-auto">
                        {quickActions.slice(0, 2).map((a, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(a)}
                                disabled={isLoading}
                                className="text-[11px] px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-neutral-400 whitespace-nowrap transition-colors disabled:opacity-40 shrink-0"
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Input ── */}
                <div className="shrink-0 px-4 py-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Ask or say 'Update stock for X to 50'…"
                            disabled={isLoading}
                            className="flex-1 min-w-0 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition disabled:opacity-50"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="shrink-0 p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
