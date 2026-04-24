"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Mail, Building, Trash2, Sparkles } from 'lucide-react';
import { Client, ClientStatus, Deal, Task } from '../store';
import { Modal } from '../components/Modal';
import { EmailDrafter } from '../components/EmailDrafter';

interface Props {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  deals?: Deal[];
  tasks?: Task[];
}

export function Clients({ clients, setClients, deals = [], tasks = [] }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailClient, setEmailClient] = useState<Client | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Active');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: Date.now(),
      name,
      company,
      email,
      status
    };
    setClients([newClient, ...clients]);
    setIsModalOpen(false);
    setName(''); setCompany(''); setEmail(''); setStatus('Active');
  };

  const handleDeleteClient = (id: number) => {
    setClients(clients.filter(c => c.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-white">Clients</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400/50 transition-all"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Company</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-white/5">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-purple-300 font-medium">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-purple-50 group-hover:text-purple-200 transition-colors">{client.name}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {client.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    {client.company}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    client.status === 'Active' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    client.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEmailClient(client)}
                      className="text-gray-500 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-purple-500/10 opacity-0 group-hover:opacity-100"
                      title="AI Email Draft"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClient(client.id)} className="text-gray-500 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-rose-500/10 opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No clients found matching &quot;{searchQuery}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI Email Drafter Modal */}
      {emailClient && (
        <EmailDrafter
          isOpen={!!emailClient}
          onClose={() => setEmailClient(null)}
          client={emailClient}
          deals={deals}
          tasks={tasks}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Client">
        <form onSubmit={handleAddClient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
            <input required type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="Acme Corp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ClientStatus)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 appearance-none">
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add Client</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
