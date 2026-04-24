// @ts-nocheck
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Send, Bot, Loader2, MessageSquare } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Markdown-lite renderer (bold, code, line-breaks only)                      */
/* ──────────────────────────────────────────────────────────────────────────── */
function renderMarkdown(text: string) {
  const html = text
    .replace(/`([^`]+)`/g, '<code class="aetherchat-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return { __html: html };
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Main component                                                             */
/* ──────────────────────────────────────────────────────────────────────────── */
export default function AetherChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chat/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_history: messages, // send full history (stateless backend)
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err?.message || "Something went wrong. Please try again."}`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  }, [input, messages, typing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* ── Global styles injected inline ── */}
      <style>{`
        .aetherchat-code {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          background: rgba(167,139,250,0.15);
          color: #c4b5fd;
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 0.8em;
        }
        .aetherchat-scrollbar::-webkit-scrollbar { width: 4px; }
        .aetherchat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .aetherchat-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124,58,237,0.35);
          border-radius: 999px;
        }
        .aetherchat-textarea {
          field-sizing: content;
          min-height: 40px;
          max-height: 120px;
        }
      `}</style>

      {/* ────────────────────────────────────────────────────────
          Floating Action Button
      ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer group"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #6d28d9 50%, #5b21b6 100%)",
              boxShadow:
                "0 0 0 1px rgba(124,58,237,0.4), 0 8px 32px rgba(124,58,237,0.45)",
            }}
            title="Chat with AetherDocs AI"
          >
            <Sparkles className="w-6 h-6 text-white" />
            {/* Pulse ring */}
            <span
              className="absolute inset-0 rounded-2xl animate-ping"
              style={{ background: "rgba(124,58,237,0.25)" }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────
          Chat Panel
      ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-6 right-6 z-[1000] flex flex-col"
            style={{
              width: 380,
              height: 520,
              background:
                "linear-gradient(160deg, rgba(15,10,25,0.97) 0%, rgba(10,8,20,0.99) 100%)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: 20,
              boxShadow:
                "0 0 0 1px rgba(124,58,237,0.12), 0 24px 64px rgba(0,0,0,0.7), 0 0 80px rgba(124,58,237,0.08)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{
                borderBottom: "1px solid rgba(124,58,237,0.2)",
                background:
                  "linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(167,139,250,0.06) 100%)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #7C3AED, #6d28d9)",
                    boxShadow: "0 2px 12px rgba(124,58,237,0.4)",
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold text-white leading-none"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    AetherDocs AI
                  </p>
                  <p className="text-[10px] text-purple-400/70 mt-0.5">
                    Grounded in your documents
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-[10px] text-purple-400/50 hover:text-purple-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages area ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 aetherchat-scrollbar">
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(167,139,250,0.1))",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">
                      Ask me about your documents
                    </p>
                    <p className="text-white/35 text-xs mt-1 leading-relaxed">
                      Vendors, totals, dates, line items — I can answer
                      anything extracted from your processed files.
                    </p>
                  </div>
                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {[
                      "What documents do I have?",
                      "Total amount across all receipts?",
                      "Show all vendors",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setInput(s);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg text-purple-300/80 hover:text-purple-200 transition-colors"
                        style={{
                          background: "rgba(124,58,237,0.12)",
                          border: "1px solid rgba(124,58,237,0.2)",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg,#7C3AED,#5b21b6)"
                          : "rgba(255,255,255,0.06)",
                      border:
                        msg.role === "assistant"
                          ? "1px solid rgba(124,58,237,0.2)"
                          : "none",
                    }}
                  >
                    {msg.role === "user" ? (
                      <span className="text-[9px] text-white font-bold">
                        U
                      </span>
                    ) : (
                      <Bot className="w-3 h-3 text-purple-400" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background:
                              "linear-gradient(135deg,rgba(124,58,237,0.7),rgba(109,40,217,0.6))",
                            border: "1px solid rgba(124,58,237,0.3)",
                            color: "#f3f0ff",
                            borderTopRightRadius: 4,
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#e2e0f0",
                            borderTopLeftRadius: 4,
                          }
                    }
                    dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                  />
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 items-center"
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}
                    >
                      <Bot className="w-3 h-3 text-purple-400" />
                    </div>
                    <div
                      className="px-3 py-2.5 rounded-2xl flex items-center gap-1"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderTopLeftRadius: 4,
                      }}
                    >
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400"
                          style={{
                            animation: `aetherchat-bounce 1s ease-in-out infinite`,
                            animationDelay: `${d * 0.15}s`,
                          }}
                        />
                      ))}
                      <style>{`
                        @keyframes aetherchat-bounce {
                          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                          30% { transform: translateY(-4px); opacity: 1; }
                        }
                      `}</style>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* ── Input area ── */}
            <div
              className="px-3 pb-3 pt-2 shrink-0"
              style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(124,58,237,0.22)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your documents…"
                  rows={1}
                  className="aetherchat-textarea flex-1 bg-transparent resize-none text-xs text-white/90 placeholder:text-white/25 outline-none border-none leading-relaxed py-1"
                  style={{ fontFamily: "inherit" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || typing}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 mb-0.5"
                  style={
                    input.trim() && !typing
                      ? {
                          background:
                            "linear-gradient(135deg,#7C3AED,#6d28d9)",
                          boxShadow: "0 2px 8px rgba(124,58,237,0.4)",
                          cursor: "pointer",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          cursor: "not-allowed",
                        }
                  }
                >
                  {typing ? (
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white/70" />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-white/20 text-center mt-1.5">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
