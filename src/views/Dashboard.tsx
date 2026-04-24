"use client";
import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MoreVertical, Clock, Phone, Mail, Calendar, Plus, Check } from 'lucide-react';
import { Client, Task, Deal, PipelineStage } from '../store';

interface Props {
  clients: Client[];
  tasks: Task[];
  deals: Deal[];
  stages: PipelineStage[];
  onNavigate: (tab: string) => void;
  onToggleTask: (id: number) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export function Dashboard({ clients, tasks, deals, stages, onNavigate, onToggleTask }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(deals.filter(d => d.stageId === 'won').reduce((sum, d) => sum + d.value, 0)),
            trend: '+12.5%'
          },
          {
            label: 'Active Clients',
            value: clients.filter(c => c.status === 'Active').length.toString(),
            trend: '+5.2%'
          },
          {
            label: 'Win Rate',
            value: deals.length > 0
              ? `${Math.round((deals.filter(d => d.stageId === 'won').length / deals.length) * 100)}%`
              : '0%',
            trend: '+2.1%'
          },
          {
            label: 'Avg Deal Size',
            value: deals.length > 0
              ? formatCurrency(deals.reduce((sum, d) => sum + d.value, 0) / deals.length)
              : '$0',
            trend: '-1.4%'
          },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-purple-400/20 transition-colors group">
            <div className="text-gray-400 text-sm font-medium mb-2 group-hover:text-purple-200 transition-colors">{stat.label}</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-light text-white tracking-tight">{stat.value}</div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-purple-50">Sales Pipeline</h2>
          <button onClick={() => onNavigate('Pipeline')} className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors">
            View full board <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stageId === stage.id);
            return (
              <div key={stage.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col h-[320px]">
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${stage.color}`}>
                    {stage.name}
                  </div>
                  <span className="text-gray-500 text-sm">{stageDeals.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {stageDeals.map((item) => (
                    <div key={item.id} className="bg-black border border-white/10 rounded-xl p-4 hover:border-purple-400/30 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-purple-50 group-hover:text-purple-200 transition-colors">{item.client}</span>
                        <button className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300 font-medium">{formatCurrency(item.value)}</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.days}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Row: Clients & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clients Table */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-purple-50">Recent Clients</h2>
            <button onClick={() => onNavigate('Clients')} className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {clients.slice(0, 4).map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-purple-50 group-hover:text-purple-200 transition-colors">{client.name}</span>
                        <span className="text-xs text-gray-500">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{client.company}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${client.status === 'Active' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          client.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-purple-300 transition-colors">
                        <MoreVertical className="w-5 h-5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tasks List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-purple-50">Upcoming Tasks</h2>
            <button onClick={() => onNavigate('Tasks')} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-purple-300 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-2 space-y-1">
            {tasks.filter(t => !t.completed).slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 rounded-xl hover:bg-white/[0.03] transition-colors group flex gap-4 items-start cursor-pointer" onClick={() => onToggleTask(task.id)}>
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${task.type === 'call' ? 'bg-blue-500/10 text-blue-400' :
                    task.type === 'email' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-purple-500/10 text-purple-400'
                  }`}>
                  {task.type === 'call' && <Phone className="w-4 h-4" />}
                  {task.type === 'email' && <Mail className="w-4 h-4" />}
                  {task.type === 'meeting' && <Calendar className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-50 group-hover:text-purple-200 transition-colors truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.time}
                  </p>
                </div>
                <button className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-1 ${task.completed ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/20 text-transparent hover:border-purple-400 hover:text-purple-400'
                  }`}>
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ))}
            {tasks.filter(t => !t.completed).length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                All caught up! No pending tasks.
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
