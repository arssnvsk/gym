'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getClientsCached, createClientProfile, setClientStatus } from '@/lib/clients';
import { useClient } from '@/components/ClientProvider';
import type { ClientProfile } from '@/types';

interface Props {
  userId: string;
}

export default function ClientsClient({ userId }: Props) {
  const router = useRouter();
  const { setActiveClient } = useClient();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingName, setAddingName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getClientsCached(userId).then((list) => {
      setClients(list);
      setLoading(false);
    });
  }, [userId]);

  const active = clients.filter((c) => c.is_active);
  const inactive = clients.filter((c) => !c.is_active);

  async function handleAdd() {
    const name = addingName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const profile = await createClientProfile(userId, name);
      setClients((prev) => [profile, ...prev]);
      setAddingName('');
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleStatus(client: ClientProfile) {
    const next = !client.is_active;
    await setClientStatus(client.id, next);
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, is_active: next } : c));
  }

  function handleSelect(client: ClientProfile) {
    setActiveClient({ id: client.id, name: client.name });
    router.push('/');
  }

  function ClientCard({ client }: { client: ClientProfile }) {
    const initials = client.name.slice(0, 2).toUpperCase();
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl">
        <button
          onClick={() => handleSelect(client)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--c-client-dot)] flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--t-text)] truncate">{client.name}</div>
            <div className="text-xs" style={{ color: 'var(--c-client-dot)' }}>
              {client.is_active ? 'Тренирую' : 'Не тренирую'}
            </div>
          </div>
        </button>
        <button
          onClick={() => handleToggleStatus(client)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[var(--t-border2)] text-[var(--t-muted)] hover:text-[var(--t-text)] hover:border-[var(--t-border3)] transition-colors"
        >
          {client.is_active ? 'Пауза' : 'Вернуть'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--t-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[var(--t-bg-alpha)] backdrop-blur-md border-b border-[var(--t-border)]">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--t-muted)] hover:text-[var(--t-text)] hover:bg-[var(--t-overlay)] transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-[var(--t-text)]">Клиенты</h1>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Add client */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Имя клиента..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--t-card)] border border-[var(--t-border)] text-sm text-[var(--t-text)] placeholder-[var(--t-muted)] outline-none focus:border-[var(--t-border3)] transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !addingName.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#FF5722] text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            Добавить
          </button>
        </div>

        {/* Active clients */}
        {loading ? (
          <div className="text-sm text-[var(--t-muted)] text-center py-8">Загрузка...</div>
        ) : active.length === 0 ? (
          <div className="text-sm text-[var(--t-muted)] text-center py-8">
            Нет активных клиентов
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {active.map((c) => <ClientCard key={c.id} client={c} />)}
          </div>
        )}

        {/* Inactive clients */}
        {inactive.length > 0 && (
          <div>
            <button
              onClick={() => setShowInactive((v) => !v)}
              className="w-full flex items-center gap-2 py-2 text-sm text-[var(--t-muted)] hover:text-[var(--t-text)] transition-colors"
            >
              <span>{showInactive ? '▾' : '▸'}</span>
              <span>Архив ({inactive.length})</span>
            </button>
            {showInactive && (
              <div className="flex flex-col gap-2 mt-2">
                {inactive.map((c) => <ClientCard key={c.id} client={c} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
