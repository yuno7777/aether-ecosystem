// @ts-nocheck
"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { authenticateUser } from './authService';

export type Role = 'admin' | 'manager' | 'sales' | 'warehouse' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isMounted: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const DEMO_USERS: Record<string, { user: User; password: string }> = {
  'admin@aether.io': {
    password: 'admin123',
    user: {
      id: 'usr-001',
      name: 'Aether Admin',
      email: 'admin@aether.io',
      role: 'admin',
    },
  },
  'manager@aether.io': {
    password: 'manager123',
    user: {
      id: 'usr-002',
      name: 'Sarah Chen',
      email: 'manager@aether.io',
      role: 'manager',
    },
  },
  'sales@aether.io': {
    password: 'sales123',
    user: {
      id: 'usr-003',
      name: 'Alex Rivera',
      email: 'sales@aether.io',
      role: 'sales',
    },
  },
  'warehouse@aether.io': {
    password: 'warehouse123',
    user: {
      id: 'usr-004',
      name: 'Jordan Lee',
      email: 'warehouse@aether.io',
      role: 'warehouse',
    },
  },
  'viewer@aether.io': {
    password: 'viewer123',
    user: {
      id: 'usr-005',
      name: 'Taylor Kim',
      email: 'viewer@aether.io',
      role: 'viewer',
    },
  },
};

// Permission matrix
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'crm:read', 'crm:write', 'crm:delete',
    'supply:read', 'supply:write', 'supply:delete',
    'pipeline:read', 'pipeline:write',
    'reports:read', 'reports:export',
    'settings:read', 'settings:write',
    'users:manage',
  ],
  manager: [
    'crm:read', 'crm:write',
    'supply:read', 'supply:write',
    'pipeline:read', 'pipeline:write',
    'reports:read', 'reports:export',
    'settings:read',
  ],
  sales: [
    'crm:read', 'crm:write',
    'pipeline:read', 'pipeline:write',
    'supply:read',
    'reports:read',
  ],
  warehouse: [
    'supply:read', 'supply:write',
    'reports:read',
  ],
  viewer: [
    'crm:read',
    'supply:read',
    'pipeline:read',
    'reports:read',
  ],
};

const ROLE_META: Record<Role, { label: string; color: string; bg: string; border: string }> = {
  admin: { label: 'Administrator', color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  manager: { label: 'Manager', color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  sales: { label: 'Sales Rep', color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  warehouse: { label: 'Warehouse Staff', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  viewer: { label: 'Viewer', color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};

export { ROLE_PERMISSIONS, ROLE_META, DEMO_USERS };

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isMounted: false,
  login: async () => false,
  logout: () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem('aether_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
    setIsMounted(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const dbUser = await authenticateUser(email, password);
      if (dbUser) {
        setUser(dbUser);
        localStorage.setItem('aether_user', JSON.stringify(dbUser));
        return true;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('aether_user');
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isMounted, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
