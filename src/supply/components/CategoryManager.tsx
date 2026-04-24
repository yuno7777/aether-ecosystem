// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Save } from 'lucide-react';

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    onAdd: (category: string) => void;
    onUpdate: (oldName: string, newName: string) => void;
    onDelete: (category: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    isOpen,
    onClose,
    categories,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');

    const resetForm = () => {
        setNewName('');
        setEditingCategory(null);
        setShowAddForm(false);
    };

    const handleEdit = (category: string) => {
        setNewName(category);
        setEditingCategory(category);
        setShowAddForm(false);
    };

    const handleSave = () => {
        if (!newName.trim()) return;

        if (editingCategory) {
            onUpdate(editingCategory, newName.trim());
        } else {
            onAdd(newName.trim());
        }
        resetForm();
    };

    const handleDelete = (category: string) => {
        if (confirm(`Are you sure you want to delete "${category}"? Products with this category will not be affected.`)) {
            onDelete(category);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Tag className="w-5 h-5 text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">Manage Categories</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {!showAddForm && !editingCategory && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 mb-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Plus className="w-4 h-4" />
                            Add Category
                        </button>
                    )}

                    {(showAddForm || editingCategory) && (
                        <div className="p-4 border border-border rounded-lg bg-muted/20 mb-4">
                            <h3 className="font-medium text-foreground mb-3">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h3>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm mb-3"
                                placeholder="Category name"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingCategory ? 'Update' : 'Add'}
                                </button>
                                <button onClick={resetForm} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {categories.map(category => (
                            <div key={category} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/20">
                                <span className="text-foreground">{category}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category)}
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
