'use client';

import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  // null = not yet mounted (avoids SSR/client hydration mismatch)
  const [online, setOnline] = useState<boolean | null>(null);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    }
    function handleOffline() {
      setOnline(false);
      setJustReconnected(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything until mounted (avoids hydration mismatch)
  if (online === null) return null;
  if (online && !justReconnected) return null;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-4 pt-2 pointer-events-none">
      {justReconnected ? (
        <div className="flex items-center gap-2 bg-green-900/90 border border-green-700/60 text-green-300 text-xs font-medium px-4 py-2.5 rounded-xl backdrop-blur-sm shadow-lg">
          <span className="text-sm">✓</span>
          Соединение восстановлено, синхронизация...
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-[#1F1F1F]/95 border border-[#333] text-[#888] text-xs font-medium px-4 py-2.5 rounded-xl backdrop-blur-sm shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#555] shrink-0" />
          Офлайн — данные сохраняются локально
        </div>
      )}
    </div>
  );
}
