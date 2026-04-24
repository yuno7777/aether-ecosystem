// @ts-nocheck
"use client";
import React from 'react';
import { ScrollText, Clock, User, Package, Truck, Warehouse as WarehouseIcon, Tag, Edit, Trash, Plus } from 'lucide-react';

export interface ActivityLogEntry {
    id: string;
    action: 'add' | 'update' | 'delete';
    entityType: 'product' | 'supplier' | 'warehouse' | 'category' | 'sale' | 'order';
    entityName: string;
    user: string;
    timestamp: Date;
    details?: string;
}

interface ActivityLogProps {
    entries: ActivityLogEntry[];
}

const getActionIcon = (action: ActivityLogEntry['action']) => {
    switch (action) {
        case 'add': return <Plus className="w-3 h-3 text-purple-400" />;
        case 'update': return <Edit className="w-3 h-3 text-blue-400" />;
        case 'delete': return <Trash className="w-3 h-3 text-red-400" />;
    }
};

const getEntityIcon = (type: ActivityLogEntry['entityType']) => {
    switch (type) {
        case 'product': return <Package className="w-4 h-4 text-muted-foreground" />;
        case 'supplier': return <Truck className="w-4 h-4 text-muted-foreground" />;
        case 'warehouse': return <WarehouseIcon className="w-4 h-4 text-muted-foreground" />;
        case 'category': return <Tag className="w-4 h-4 text-muted-foreground" />;
        default: return <ScrollText className="w-4 h-4 text-muted-foreground" />;
    }
};

const getActionText = (action: ActivityLogEntry['action']) => {
    switch (action) {
        case 'add': return 'Added';
        case 'update': return 'Updated';
        case 'delete': return 'Deleted';
    }
};

const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ entries }) => {
    const sortedEntries = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    Activity Log <ScrollText className="w-6 h-6 text-cyan-400" />
                </h1>
                <p className="text-muted-foreground mt-1">Track all changes made to your inventory data.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Total Activities</p>
                    <p className="text-2xl font-bold text-foreground">{entries.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Additions</p>
                    <p className="text-2xl font-bold text-purple-400">{entries.filter(e => e.action === 'add').length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Updates</p>
                    <p className="text-2xl font-bold text-blue-400">{entries.filter(e => e.action === 'update').length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">Deletions</p>
                    <p className="text-2xl font-bold text-red-400">{entries.filter(e => e.action === 'delete').length}</p>
                </div>
            </div>

            {/* Activity List */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Recent Activity</h3>
                </div>

                {sortedEntries.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No activity recorded yet</p>
                        <p className="text-sm mt-1">Activities will appear here when you make changes</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                        {sortedEntries.map(entry => (
                            <div key={entry.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-muted rounded-lg">
                                        {getEntityIcon(entry.entityType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {getActionIcon(entry.action)}
                                            <span className="font-medium text-foreground">
                                                {getActionText(entry.action)} {entry.entityType}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground mt-1">{entry.entityName}</p>
                                        {entry.details && (
                                            <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(entry.timestamp)}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <User className="w-3 h-3" />
                                            {entry.user}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
