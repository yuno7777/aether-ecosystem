// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, Truck, History, Sparkles, Settings, FileText, DollarSign, Layers, Percent, TrendingUp, Bell, Warehouse, ScrollText, LogOut, ChevronDown, ChevronRight, BarChart3, Building2, Cpu, ArrowRightLeft, Brain, ScanLine } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth, ROLE_META } from '../../auth/AuthProvider';


interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
  defaultOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const user = { firstName: 'User' };

  // Menu groups configuration
  const menuGroups: MenuGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
      defaultOpen: true
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      items: [
        { id: 'inventory', label: 'Products', icon: Package },
        { id: 'sales', label: 'Sales', icon: History },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: FileText },
        { id: 'scanner', label: 'Barcode Scanner', icon: ScanLine },
        { id: 'reorder', label: 'Smart Reorder', icon: ShoppingCart },
      ],
      defaultOpen: true
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Building2,
      items: [
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
        { id: 'supplier-alerts', label: 'Supplier Alerts', icon: Bell },
        { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
        { id: 'stock-transfer', label: 'Stock Transfer', icon: ArrowRightLeft },
      ],
      defaultOpen: true
    },
    {
      id: 'analytics',
      label: 'AI & Analytics',
      icon: Cpu,
      items: [
        { id: 'intelligence', label: 'AI Intelligence', icon: Sparkles },
        { id: 'demand-forecast', label: 'Demand Forecast', icon: Brain },
        { id: 'stock-alerts', label: 'Stock Alerts', icon: Bell },
        { id: 'category-analytics', label: 'Categories', icon: Layers },
        { id: 'profit-margins', label: 'Profit Margins', icon: Percent },
        { id: 'trends', label: 'Trend Analysis', icon: TrendingUp },
        { id: 'pricing', label: 'Price Optimizer', icon: DollarSign },
      ],
      defaultOpen: false
    },
    {
      id: 'system',
      label: 'System',
      icon: Settings,
      items: [
        { id: 'activity-log', label: 'Activity Log', icon: ScrollText },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
      defaultOpen: false
    },
  ];

  // Get initial state from localStorage or defaults
  const getInitialExpandedState = () => {
    const saved = localStorage.getItem('sidebar-expanded-groups');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default expanded state
    return menuGroups.reduce((acc, group) => {
      acc[group.id] = group.defaultOpen ?? true;
      return acc;
    }, {} as Record<string, boolean>);
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(getInitialExpandedState);

  // Save to localStorage when expanded state changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  // Auto-expand group containing current view
  useEffect(() => {
    const groupContainingView = menuGroups.find(g => g.items.some(i => i.id === currentView));
    if (groupContainingView && !expandedGroups[groupContainingView.id]) {
      setExpandedGroups(prev => ({ ...prev, [groupContainingView.id]: true }));
    }
  }, [currentView]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="sidebar-desktop w-64 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-3 text-foreground">
          {/* Logo: 3 Gears Triangle */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <Settings className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 text-foreground" strokeWidth={2} />
            <Settings className="absolute bottom-0 left-0 w-4 h-4 text-foreground" strokeWidth={2} />
            <Settings className="absolute bottom-0 right-0 w-4 h-4 text-foreground" strokeWidth={2} />
          </div>
          <span className="sidebar-logo-text">Aether Supply</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-3 pl-1 sidebar-text">Inventory Intelligence</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto min-h-0 pb-4">
        {menuGroups.map(group => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups[group.id];
          const hasActiveItem = group.items.some(item => item.id === currentView);

          return (
            <div key={group.id} className="mb-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all duration-200 ${hasActiveItem
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
              >
                <GroupIcon className="w-3.5 h-3.5" />
                <span className="sidebar-text flex-1 text-left">{group.label}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 sidebar-text" />
                ) : (
                  <ChevronRight className="w-3 h-3 sidebar-text" />
                )}
              </button>

              {/* Group Items */}
              <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="mt-1 ml-2 space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    const isIntelligence = item.id === 'intelligence';

                    return (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group outline-none focus:outline-none ${isActive
                          ? isIntelligence
                            ? 'bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30'
                            : 'bg-primary/10 text-primary font-medium border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                          }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive
                          ? isIntelligence ? 'text-purple-400' : 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        />
                        <span className={`sidebar-text ${isActive ? (isIntelligence ? 'text-purple-300' : 'text-primary') : ''}`}>{item.label}</span>
                        {isActive && (
                          <div className={`ml-auto w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse ${isIntelligence ? 'bg-purple-400' : 'bg-primary'}`}></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Theme Toggle & User Profile */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <Link href="/" className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-destructive hover:text-destructive-foreground hover:bg-destructive/90 transition-colors w-full group">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="sidebar-text font-medium">Exit to Platform</span>
        </Link>
        <AuthUserBlock />
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground sidebar-text">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

function AuthUserBlock() {
  const { user: authUser, logout } = useAuth();
  if (!authUser) return null;
  const meta = ROLE_META[authUser.role];
  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <div className={`w-8 h-8 rounded-full ${meta.bg} border ${meta.border} flex items-center justify-center ${meta.color} text-xs font-bold`}>{authUser.name.charAt(0)}</div>
        <div className="flex flex-col sidebar-text flex-1 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">{authUser.name}</span>
          <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
        </div>
      </div>
      <button onClick={logout} className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors w-full">
        <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="sidebar-text">Sign Out</span>
      </button>
    </>
  );
}