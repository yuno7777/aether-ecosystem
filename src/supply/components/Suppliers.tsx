// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { Supplier, SupplierDelivery, ProductAnalytics, Product } from '../types';
import { Mail, Clock, Truck, Building2, Star, Send, BarChart3, MapPin, Users } from 'lucide-react';
import { SupplierScorecard } from './SupplierScorecard';
import { LeadTimeHistory } from './LeadTimeHistory';
import { AutoReorder } from './AutoReorder';

interface SuppliersProps {
  suppliers: Supplier[];
  deliveries?: SupplierDelivery[];
  analytics?: ProductAnalytics[];
  products?: Product[];
}

type Tab = 'overview' | 'scorecards' | 'lead-time';

const renderStars = (rating: number) => {
  const stars: React.ReactNode[] = [];
  const fullStars = Math.floor(rating);

  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-3 h-3 ${i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
      />
    );
  }
  return stars;
};

export const Suppliers: React.FC<SuppliersProps> = ({ suppliers, deliveries = [], analytics = [], products = [] }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAutoReorder, setShowAutoReorder] = useState(false);

  const handleQuickOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowAutoReorder(true);
  };

  const getBackupCount = (supplierId: string) => {
    return products.filter(p =>
      p.supplierIds && p.supplierIds.length > 1 && p.supplierIds.includes(supplierId) && p.supplierId !== supplierId
    ).length;
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: Building2 },
    { id: 'scorecards' as Tab, label: 'Scorecards', icon: BarChart3 },
    { id: 'lead-time' as Tab, label: 'Lead Time', icon: Clock },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Supplier Network</h2>
          <p className="text-muted-foreground">Manage your supply chain partners, scorecards, and lead times.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="group rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Building2 className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-none mb-1 text-foreground">{supplier.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {supplier.rating && (
                          <div className="flex items-center gap-0.5">
                            {renderStars(supplier.rating)}
                            <span className="text-xs text-muted-foreground ml-1">{supplier.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {supplier.onTimePercent !== undefined && (
                    <span className={`px-2 py-1 text-xs rounded font-medium ${supplier.onTimePercent >= 90 ? 'bg-purple-500/20 text-purple-400' :
                      supplier.onTimePercent >= 75 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                      {supplier.onTimePercent}% on-time
                    </span>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  {supplier.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {supplier.location}
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Lead Time</span>
                    </div>
                    <span className="font-semibold text-foreground">{supplier.leadTimeDays} days</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pl-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${supplier.contactEmail}`} className="hover:text-primary transition-colors hover:underline">
                      {supplier.contactEmail}
                    </a>
                  </div>

                  {getBackupCount(supplier.id) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-400 pl-2">
                      <Users className="w-4 h-4" />
                      Backup for {getBackupCount(supplier.id)} products
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 bg-muted/20 border-t border-border flex justify-between">
                <button
                  onClick={() => handleQuickOrder(supplier)}
                  className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Quick Order
                </button>
                <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  View Details <span className="text-xs">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'scorecards' && (
        <SupplierScorecard suppliers={suppliers} deliveries={deliveries} />
      )}

      {activeTab === 'lead-time' && (
        <LeadTimeHistory suppliers={suppliers} deliveries={deliveries} products={products} />
      )}

      {/* Auto Reorder Modal */}
      <AutoReorder
        isOpen={showAutoReorder}
        onClose={() => setShowAutoReorder(false)}
        supplier={selectedSupplier}
        analytics={analytics}
      />
    </div>
  );
};