'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'gym-active-client';

interface ActiveClient {
  id: string;
  name: string;
}

interface ClientCtxValue {
  activeClient: ActiveClient | null;
  setActiveClient: (c: ActiveClient | null) => void;
}

const ClientCtx = createContext<ClientCtxValue>({
  activeClient: null,
  setActiveClient: () => {},
});

export function useClient() { return useContext(ClientCtx); }

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setActiveClientState(JSON.parse(raw));
    } catch {}
  }, []);

  const setActiveClient = useCallback((c: ActiveClient | null) => {
    setActiveClientState(c);
    try {
      if (c) sessionStorage.setItem(SESSION_KEY, JSON.stringify(c));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  return (
    <ClientCtx.Provider value={{ activeClient, setActiveClient }}>
      {children}
    </ClientCtx.Provider>
  );
}
