'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClientsCached, createClientProfile, setClientStatus, deleteClientProfile } from '@/lib/clients';
import { getSessionsCached, refreshSessions } from '@/lib/client-sessions';
import { useClient } from '@/components/ClientProvider';
import type { ClientProfile, ClientSession } from '@/types';

interface Props {
  userId: string;
}

const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DOW_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

function fmtNextVisit(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  let dateStr: string;
  if (isSame(d, today))     dateStr = 'Сегодня';
  else if (isSame(d, tomorrow)) dateStr = 'Завтра';
  else dateStr = `${DOW_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return `${dateStr}, ${time}`;
}

export default function ClientsClient({ userId }: Props) {
  const router = useRouter();
  const { setActiveClient } = useClient();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [nextVisit, setNextVisit] = useState<Map<string, ClientSession>>(new Map());
  const [loading, setLoading] = useState(true);
  const [addingName, setAddingName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function buildNextVisitMap(sessions: ClientSession[]): Map<string, ClientSession> {
    const now = new Date();
    const map = new Map<string, ClientSession>();
    const sorted = [...sessions].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    for (const s of sorted) {
      if (new Date(s.scheduled_at) >= now && !map.has(s.client_profile_id)) {
        map.set(s.client_profile_id, s);
      }
    }
    return map;
  }

  useEffect(() => {
    let alive = true;

    getClientsCached(userId, (fresh) => {
      if (alive) setClients(fresh);
    }).then((list) => {
      if (alive) { setClients(list); setLoading(false); }
    });

    getSessionsCached(userId).then((sessions) => {
      if (alive) setNextVisit(buildNextVisitMap(sessions));
    });

    refreshSessions(userId).then((sessions) => {
      if (alive) setNextVisit(buildNextVisitMap(sessions));
    }).catch(() => {});

    return () => { alive = false; };
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
    await setClientStatus(client.id, userId, next);
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, is_active: next } : c));
    if (!next) {
      setNextVisit((prev) => { const m = new Map(prev); m.delete(client.id); return m; });
    }
  }

  async function handleDelete(client: ClientProfile) {
    setDeleting(true);
    try {
      await deleteClientProfile(client.id, userId);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setNextVisit((prev) => { const m = new Map(prev); m.delete(client.id); return m; });
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  }

  function handleSelect(client: ClientProfile) {
    setActiveClient({ id: client.id, name: client.name });
    router.push('/');
  }

  function ClientCard({ client }: { client: ClientProfile }) {
    const initials = client.name.slice(0, 2).toUpperCase();
    const upcoming = nextVisit.get(client.id);

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
            {upcoming ? (
              <div className="text-xs text-[#FF5722] truncate">
                {fmtNextVisit(upcoming.scheduled_at)}
              </div>
            ) : (
              <div className="text-xs text-[var(--t-faint)]">
                {client.is_active ? 'Нет записей' : 'Не тренирую'}
              </div>
            )}
          </div>
        </button>
        {confirmDeleteId === client.id ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleDelete(client)}
              disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-40 transition-opacity"
            >
              Удалить
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--t-border2)] text-[var(--t-muted)] hover:text-[var(--t-text)] transition-colors"
            >
              Отмена
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleToggleStatus(client)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--t-border2)] text-[var(--t-muted)] hover:text-[var(--t-text)] hover:border-[var(--t-border3)] transition-colors"
            >
              {client.is_active ? 'Пауза' : 'Вернуть'}
            </button>
            <button
              onClick={() => setConfirmDeleteId(client.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--t-muted)] hover:text-red-500 hover:bg-[var(--t-overlay)] transition-colors text-base"
              title="Удалить клиента"
            >
              🗑
            </button>
          </div>
        )}
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
        <h1 className="text-lg font-bold text-[var(--t-text)] flex-1">Клиенты</h1>
        <Link
          href="/clients/calendar"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--t-muted)] hover:text-[var(--t-text)] hover:bg-[var(--t-overlay)] transition-colors text-lg"
          title="Календарь"
        >
          📅
        </Link>
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
          <div className="text-sm text-[var(--t-muted)] text-center py-8">Нет активных клиентов</div>
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
