"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Check, Clock, Phone, Mail, Calendar, Trash2 } from 'lucide-react';
import { Task, TaskType } from '../store';
import { Modal } from '../components/Modal';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onToggleTask: (id: number) => void;
}

export function Tasks({ tasks, setTasks, onToggleTask }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<TaskType>('call');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now(),
      title,
      time,
      type,
      completed: false
    };
    setTasks([newTask, ...tasks]);
    setIsModalOpen(false);
    setTitle(''); setTime(''); setType('call');
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-white">Tasks</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Pending ({pendingTasks.length})</h2>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-2 space-y-1">
            {pendingTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl hover:bg-white/[0.03] transition-colors group flex gap-4 items-center">
                <button onClick={() => onToggleTask(task.id)} className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-transparent hover:border-purple-400 hover:text-purple-400 transition-colors shrink-0">
                  <Check className="w-3 h-3" />
                </button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  task.type === 'call' ? 'bg-blue-500/10 text-blue-400' :
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
                <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No pending tasks.</div>
            )}
          </div>
        </section>

        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Completed ({completedTasks.length})</h2>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-2 space-y-1 opacity-60">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-xl hover:bg-white/[0.03] transition-colors group flex gap-4 items-center">
                  <button onClick={() => onToggleTask(task.id)} className="w-6 h-6 rounded-full bg-purple-500 border-purple-500 flex items-center justify-center text-white transition-colors shrink-0">
                    <Check className="w-3 h-3" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-400 line-through truncate">
                      {task.title}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Task Title</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="Follow up with client" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Due Time</label>
            <input required type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="Tomorrow, 2:00 PM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value as TaskType)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 appearance-none">
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add Task</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
