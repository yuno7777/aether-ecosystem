// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Building2, Save, MapPin, Mail, Clock } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierManagerProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    onAdd: (supplier: Omit<Supplier, 'id'>) => void;
    onUpdate: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
    isOpen,
    onClose,
    suppliers,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contactEmail: '',
        leadTimeDays: 5,
        location: '',
        rating: 4.0,
        onTimePercent: 90,
        totalOrders: 0,
        fulfillmentRate: 95
    });

    const resetForm = () => {
        setFormData({
            name: '',
            contactEmail: '',
            leadTimeDays: 5,
            location: '',
            rating: 4.0,
            onTimePercent: 90,
            totalOrders: 0,
            fulfillmentRate: 95
        });
        setEditingId(null);
        setShowAddForm(false);
    };

    const handleEdit = (supplier: Supplier) => {
        setFormData({
            name: supplier.name,
            contactEmail: supplier.contactEmail,
            leadTimeDays: supplier.leadTimeDays,
            location: supplier.location || '',
            rating: supplier.rating || 4.0,
            onTimePercent: supplier.onTimePercent || 90,
            totalOrders: supplier.totalOrders || 0,
            fulfillmentRate: supplier.fulfillmentRate || 95
        });
        setEditingId(supplier.id);
        setShowAddForm(false);
    };

    const handleSave = () => {
        if (!formData.name || !formData.contactEmail) return;

        if (editingId) {
            onUpdate({ id: editingId, ...formData });
        } else {
            onAdd(formData);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
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
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Manage Suppliers</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Add Button */}
                    {!showAddForm && !editingId && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 mb-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Plus className="w-4 h-4" />
                            Add Supplier
                        </button>
                    )}

                    {/* Add/Edit Form */}
                    {(showAddForm || editingId) && (
                        <div className="p-4 border border-border rounded-lg bg-muted/20 mb-4">
                            <h3 className="font-medium text-foreground mb-3">
                                {editingId ? 'Edit Supplier' : 'Add New Supplier'}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs text-muted-foreground">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        placeholder="Supplier name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        placeholder="contact@supplier.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Lead Time (days)</label>
                                    <input
                                        type="number"
                                        value={formData.leadTimeDays}
                                        onChange={(e) => setFormData(prev => ({ ...prev, leadTimeDays: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        min="1"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-muted-foreground">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
                                        placeholder="City, Country"
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
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Supplier List */}
                    <div className="space-y-2">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20">
                                <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{supplier.name}</h4>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {supplier.contactEmail}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {supplier.leadTimeDays}d lead time
                                        </span>
                                        {supplier.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {supplier.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
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
