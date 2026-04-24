"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Clock, Trash2, GripVertical } from 'lucide-react';
import { Deal, PipelineStage } from '../store';
import { Modal } from '../components/Modal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createDeal, updateDealStage, deleteDeal } from '../app/crm/dataService';

interface Props {
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  stages: PipelineStage[];
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export function Pipeline({ deals, setDeals, stages, isModalOpen, setIsModalOpen }: Props) {
  const [client, setClient] = useState('');
  const [value, setValue] = useState('');
  const [stageId, setStageId] = useState(stages[0].id);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const dealId = parseInt(draggableId.replace('deal-', ''), 10);
    const newStageId = destination.droppableId;
    
    // Optimistic update
    setDeals(prev => prev.map(deal =>
      deal.id === dealId ? { ...deal, stageId: newStageId } : deal
    ));

    try {
      await updateDealStage(dealId, newStageId);
    } catch (error) {
      console.error("Failed to update deal stage:", error);
      // Revert if needed (simplified here)
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const dealData = {
      client,
      value: parseFloat(value) || 0,
      days: 0,
      stageId
    };

    try {
      const newDeal = await createDeal(dealData);
      setDeals([...deals, newDeal]);
      setIsModalOpen(false);
      setClient(''); setValue(''); setStageId(stages[0].id);
    } catch (error) {
      console.error("Failed to add deal:", error);
    }
  };

  const handleDeleteDeal = async (id: number) => {
    // Optimistic delete
    setDeals(deals.filter(d => d.id !== id));
    try {
      await deleteDeal(id);
    } catch (error) {
      console.error("Failed to delete deal:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-medium text-white">Sales Pipeline</h1>
          <p className="text-xs text-gray-500 mt-1">Drag and drop deals between stages</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stageId === stage.id);
            const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-2xl p-4 flex flex-col min-w-[300px] w-[300px] transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? 'bg-purple-500/5 border-2 border-purple-500/30 shadow-[0_0_30px_rgba(167,139,250,0.1)]'
                        : 'bg-[#0a0a0a] border border-white/5'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${stage.color}`}>
                        {stage.name}
                      </div>
                      <span className="text-gray-500 text-sm font-medium">{stageDeals.length}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-4 px-1">{formatCurrency(totalValue)}</div>

                    {/* Deal Cards */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[100px]">
                      {stageDeals.map((item, index) => (
                        <Draggable key={item.id} draggableId={`deal-${item.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-black border rounded-xl p-4 group transition-all duration-150 ${
                                snapshot.isDragging
                                  ? 'border-purple-400/50 shadow-lg shadow-purple-500/10 rotate-1 scale-[1.02]'
                                  : 'border-white/10 hover:border-purple-400/30'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {/* Drag Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="pt-0.5 text-gray-700 hover:text-purple-400 transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm text-purple-50 group-hover:text-purple-200 transition-colors truncate">
                                      {item.client}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteDeal(item.id)}
                                      className="text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-rose-500/10 shrink-0 ml-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-purple-300 font-medium">{formatCurrency(item.value)}</span>
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {item.days}d
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Deal">
        <form onSubmit={handleAddDeal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Client Name</label>
            <input required type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="Acme Corp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Deal Value ($)</label>
            <input required type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500" placeholder="10000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Initial Stage</label>
            <select value={stageId} onChange={e => setStageId(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 appearance-none">
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="bg-purple-500 hover:bg-purple-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add Deal</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
