'use client';

import { useClient } from '@/components/ClientProvider';

export default function ClientBanner() {
  const { activeClient, setActiveClient } = useClient();
  if (!activeClient) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-sm"
      style={{
        background: 'var(--c-client-bg)',
        borderBottom: '1px solid var(--c-client-border)',
        color: 'var(--c-client-text)',
      }}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: 'var(--c-client-dot)' }}
      />
      <span className="flex-1 truncate font-medium">
        {activeClient.name}
      </span>
      <button
        onClick={() => setActiveClient(null)}
        className="shrink-0 text-xs opacity-70 hover:opacity-100 transition-opacity"
      >
        ← Свои тренировки
      </button>
    </div>
  );
}
