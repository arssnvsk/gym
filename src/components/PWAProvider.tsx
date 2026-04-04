'use client';

import { useEffect } from 'react';
import { syncPendingOperations } from '@/lib/sync';

export default function PWAProvider() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => { /* SW not critical */ });
    }

    // Sync on initial load (handles any ops queued while offline)
    syncPendingOperations().catch(() => {});

    // Sync whenever connection is restored
    function handleOnline() {
      syncPendingOperations().catch(() => {});
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return null;
}
