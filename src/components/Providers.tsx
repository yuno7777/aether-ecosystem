  "use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import { LoginScreen } from '../auth/LoginScreen';

const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isMounted } = useAuth();
  
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7663b0]/30 border-t-[#7663b0] rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        {children}
        <CommandPalette />
      </AuthGate>
    </AuthProvider>
  );
}
