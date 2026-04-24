"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Building2, Briefcase, FileText, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CompanySettings {
  companyName: string;
  address: string;
  taxId: string;
  logo: string; // Base64
}

export const defaultSettings: CompanySettings = {
  companyName: '',
  address: '',
  taxId: '',
  logo: '',
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('aether_docs_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('aether_docs_settings', JSON.stringify(settings));
      setIsSaved(true);
      setError(null);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        setError('Logo is too large to save in local storage. Please choose a smaller image.');
      } else {
        setError('Failed to save settings.');
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 2MB to safely store in localStorage)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings(prev => ({ ...prev, logo: event.target?.result as string }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Invoice Branding & Settings</h2>
        <p className="text-sm text-gray-400">Configure your company details. These will be automatically populated on generated invoices.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Company Name
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={e => setSettings(p => ({ ...p, companyName: e.target.value }))}
              placeholder="Aether Ecosystem Inc."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> Tax ID / GSTIN
            </label>
            <input
              type="text"
              value={settings.taxId}
              onChange={e => setSettings(p => ({ ...p, taxId: e.target.value }))}
              placeholder="e.g. 27ABCDE1234F1Z5"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Registered Address
          </label>
          <textarea
            value={settings.address}
            onChange={e => setSettings(p => ({ ...p, address: e.target.value }))}
            placeholder="123 Innovation Drive..."
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" /> Company Logo
          </label>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              {settings.logo ? (
                <img src={settings.logo} alt="Company Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-white/10" />
              )}
            </div>
            
            <div className="space-y-3">
              <input
                type="file"
                id="logo-upload"
                accept="image/png, image/jpeg, image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <label
                htmlFor="logo-upload"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors cursor-pointer inline-block"
              >
                Upload New Logo
              </label>
              <p className="text-xs text-gray-500 max-w-xs">Recommended size: 512x512px. Max 2MB. Transparent PNG works best.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-black font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaved ? 'Settings Saved' : 'Save Settings'}
        </button>
      </div>
    </motion.div>
  );
}
