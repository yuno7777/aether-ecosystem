import React from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, Palette } from 'lucide-react';

export function Settings() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-medium text-white">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-300 font-medium transition-colors">
            <User className="w-5 h-5" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-purple-200 hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-purple-200 hover:bg-white/5 transition-colors">
            <Shield className="w-5 h-5" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-purple-200 hover:bg-white/5 transition-colors">
            <Palette className="w-5 h-5" /> Appearance
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-medium text-white border-b border-white/10 pb-4">Profile Information</h2>
            
            <div className="flex items-center gap-6">
              <img 
                src="https://picsum.photos/seed/avatar/100/100" 
                alt="User" 
                className="w-20 h-20 rounded-full border border-white/20"
                referrerPolicy="no-referrer"
              />
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                Change Avatar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                <input type="text" defaultValue="Jane" className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                <input type="text" defaultValue="Doe" className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input type="email" defaultValue="jane@aethercrm.io" className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                <textarea rows={4} defaultValue="Senior Account Executive at AetherCRM." className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"></textarea>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="bg-purple-500 hover:bg-purple-400 text-black px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
