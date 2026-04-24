"use client";
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Sparkles, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { Client, Deal, Task } from '../store';

interface EmailDrafterProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  deals: Deal[];
  tasks: Task[];
}

export function EmailDrafter({ isOpen, onClose, client, deals, tasks }: EmailDrafterProps) {
  const [emailContent, setEmailContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const clientDeals = deals.filter(d => d.client.toLowerCase().includes(client.company.split(' ')[0].toLowerCase()));
  const clientTasks = tasks.filter(t => t.title.toLowerCase().includes(client.name.split(' ')[0].toLowerCase()));

  const generateEmail = useCallback(async () => {
    setIsGenerating(true);
    setError('');

    const contextData = {
      clientName: client.name,
      company: client.company,
      status: client.status,
      relatedDeals: clientDeals.map(d => ({ stage: d.stageId, value: d.value })),
      pendingTasks: clientTasks.filter(t => !t.completed).map(t => ({ title: t.title, type: t.type })),
    };

    try {
      // Call the Gemini API via our genkit service
      const { generateText } = await import('../supply/services/aiService');
      
      const prompt = `Write a professional, personalized follow-up email for a CRM sales representative. Be warm but concise. Use a professional tone.

Client Context:
- Name: ${contextData.clientName}
- Company: ${contextData.company}
- Relationship Status: ${contextData.status}
- Active Deals: ${contextData.relatedDeals.length > 0 ? contextData.relatedDeals.map(d => `Stage: ${d.stage}, Value: $${d.value}`).join('; ') : 'None currently'}
- Pending Tasks: ${contextData.pendingTasks.length > 0 ? contextData.pendingTasks.map(t => t.title).join('; ') : 'None'}

Write ONLY the email body (no subject line). Start with a greeting. Keep it under 150 words. End with a professional sign-off using "Best regards" and the name "Your Name" as a placeholder.`;

      const result = await generateText({
        prompt,
        systemPrompt: 'You are a professional CRM email assistant. Write concise, personalized, and professional emails.'
      });

      setEmailContent(result);
    } catch (err: any) {
      if (err?.message === 'QUOTA_EXCEEDED') {
        setError('AI quota exceeded. Please try again later.');
      } else if (err?.message === 'API_KEY_MISSING') {
        setError('Gemini API key not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local');
      } else {
        setError('Failed to generate email. Using fallback template.');
      }
      // Fallback template
      setEmailContent(`Dear ${client.name},

I hope this message finds you well. I wanted to follow up on our recent conversations regarding your needs at ${client.company}.

${clientDeals.length > 0 ? `I see we have ${clientDeals.length} active discussion(s) in our pipeline, and I wanted to make sure everything is progressing smoothly on your end.` : `I'd love to explore how we can work together to address your current challenges.`}

${clientTasks.length > 0 ? `I also have a few action items on my end that I'm actively working on for you.` : ''}

Would you be available for a brief call this week to discuss next steps? I'm flexible with timing and happy to work around your schedule.

Best regards,
Your Name`);
    } finally {
      setIsGenerating(false);
    }
  }, [client, clientDeals, clientTasks]);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-generate on open
  React.useEffect(() => {
    if (isOpen && !emailContent && !isGenerating) {
      generateEmail();
    }
  }, [isOpen]);

  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setEmailContent('');
      setError('');
      setCopied(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl"
          >
            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">AI Email Draft</h3>
                    <p className="text-xs text-gray-500">For {client.name} at {client.company}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Context Pills */}
              <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                  client.status === 'Active' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  client.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {client.status}
                </span>
                {clientDeals.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {clientDeals.length} Active Deal{clientDeals.length > 1 ? 's' : ''}
                  </span>
                )}
                {clientTasks.filter(t => !t.completed).length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {clientTasks.filter(t => !t.completed).length} Pending Task{clientTasks.filter(t => !t.completed).length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Email Body */}
              <div className="px-6 py-4">
                {isGenerating ? (
                  <div className="py-16 flex flex-col items-center gap-3">
                    <div className="relative">
                      <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Drafting personalized email...
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={emailContent}
                    onChange={e => setEmailContent(e.target.value)}
                    rows={12}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-sans"
                    placeholder="Your AI-generated email will appear here..."
                  />
                )}

                {error && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={generateEmail}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!emailContent || isGenerating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 hover:bg-purple-400 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy to Clipboard</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
