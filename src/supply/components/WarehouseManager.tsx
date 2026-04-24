// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Warehouse as WarehouseIcon, Save, MapPin, Box } from 'lucide-react';
import { Warehouse } from '../types';

interface WarehouseManagerProps {
    isOpen: boolean;
    onClose: () => void;
    warehouses: Warehouse[];
    onAdd: (warehouse: Omit<Warehouse, 'id'>) => void;
    onUpdate: (warehouse: Warehouse) => void;
    onDelete: (id: string) => void;
}

export const WarehouseManager: React.FC<WarehouseManagerProps> = ({
    isOpen,
    onClose,
    warehouses,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 1000
    });

    const resetForm = () => {
        setFormData({ name: '', location: '', capacity: 1000 });
        setEditingId(null);
        setShowAddForm(false);
    };

    const handleEdit = (warehouse: Warehouse) => {
        setFormData({
            name: warehouse.name,
            location: warehouse.location,
            capacity: warehouse.capacity
        });
        setEditingId(warehouse.id);
        setShowAddForm(false);
    };

    const handleSave = () => {
        if (!formData.name || !formData.location) return;

        if (editingId) {
            onUpdate({ id: editingId, ...formData });
        } else {
            onAdd(formData);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this warehouse?')) {
            onDelete(id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <WarehouseIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Manage Warehouses</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {!showAddForm && !editingId && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 mb-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Plus className="w-4 h-4" />
                            Add Warehouse
                        </button>
                    )}

                    {(showAddForm || editingId) && (
                        <div className="p-4 border border-border rounded-lg bg-muted/20 mb-4">
                            <h3 className="font-medium text-foreground mb-3">
                                {editingId ? 'Edit Warehouse' : 'Add New Warehouse'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs text-muted-foreground">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        placeholder="Warehouse name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Location *</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        placeholder="City, State"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Capacity (units)</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingId ? 'Update' : 'Add'}
                                </button>
                                <button onClick={resetForm} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {warehouses.map(warehouse => (
                            <div key={warehouse.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20">
                                <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{warehouse.name}</h4>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {warehouse.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Box className="w-3 h-3" />
                                            {warehouse.capacity.toLocaleString()} capacity
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(warehouse)}
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(warehouse.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
