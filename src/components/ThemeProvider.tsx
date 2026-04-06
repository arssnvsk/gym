'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { updatePreferences, type AppTheme } from '@/lib/preferences';

const STORAGE_KEY = 'gym-theme';

type ResolvedTheme = 'dark' | 'light';

interface ThemeCtxValue {
  theme: AppTheme;
  resolved: ResolvedTheme;
  setTheme: (t: AppTheme) => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  theme: 'dark',
  resolved: 'dark',
  setTheme: () => {},
});

export function useTheme() { return useContext(ThemeCtx); }

function resolveTheme(t: AppTheme): ResolvedTheme {
  if (t === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return t === 'light' ? 'light' : 'dark';
}

export default function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: AppTheme;
  children: React.ReactNode;
}) {
  // Initialized from SSR value — no async, matches what the blocking script applied
  const [theme, setThemeState] = useState<AppTheme>(initialTheme);
  const resolved = resolveTheme(theme);

  // Keep <html> class in sync when theme changes after initial render
  useEffect(() => {
    document.documentElement.classList.toggle('light', resolved === 'light');
  }, [resolved]);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
    updatePreferences({ theme: t });
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
