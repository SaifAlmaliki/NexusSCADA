'use client';

import { SessionProvider } from 'next-auth/react';
import { ScopeProvider } from '@/components/ScopeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ScopeProvider>{children}</ScopeProvider>
    </SessionProvider>
  );
}

