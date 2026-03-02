'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type ScopeContextValue = {
  siteId?: string;
  setSiteId: (id?: string) => void;
};

const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [siteId, setSiteIdState] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('nexus-site-id') : null;
    if (stored) setSiteIdState(stored);
  }, []);

  const setSiteId = (id?: string) => {
    setSiteIdState(id);
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem('nexus-site-id', id);
      else window.localStorage.removeItem('nexus-site-id');
    }
  };

  return (
    <ScopeContext.Provider value={{ siteId, setSiteId }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) {
    throw new Error('useScope must be used within ScopeProvider');
  }
  return ctx;
}

