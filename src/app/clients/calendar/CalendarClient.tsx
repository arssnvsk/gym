'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getClientsCached, refreshClients } from '@/lib/clients';
import {
  getSessionsCached,
  refreshSessions,
  createSession,
  updateSession,
  deleteSession,
} from '@/lib/client-sessions';
import type { ClientProfile, ClientSession } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#A855F7',
  '#F97316', '#06B6D4', '#EC4899', '#84CC16',
  '#F59E0B', '#14B8A6',
];

const HOUR_HEIGHT = 60;  // px per hour in time grid
const START_HOUR   = 7;
const END_HOUR     = 22;
const TOTAL_HOURS  = END_HOUR - START_HOUR;
const GRID_HEIGHT  = TOTAL_HOURS * HOUR_HEIGHT;

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const MONTHS_SHORT = [
  'янв','фев','мар','апр','май','июн',
  'июл','авг','сен','окт','ноя','дек',
];
const DOW_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

type CalendarView = 'month' | '3day' | 'day';

interface ModalState {
  mode: 'create' | 'edit';
  session?: ClientSession;
  defaults?: { date: string; time: string };
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function buildColorMap(clients: ClientProfile[]): Record<string, string> {
  return Object.fromEntries(clients.map((c, i) => [c.id, COLORS[i % COLORS.length]]));
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function fmtDow(d: Date): string {
  return DOW_SHORT[(d.getDay() + 6) % 7];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sessionsForDay(sessions: ClientSession[], date: Date): ClientSession[] {
  return sessions
    .filter(s => isSameDay(new Date(s.scheduled_at), date))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}

/** Truncates ISO to minute precision for grouping/conflict checks */
function timeKey(iso: string): string {
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

/** Groups sessions by start minute — same key = paired/group training */
function groupByMinute(sessions: ClientSession[]): Map<string, ClientSession[]> {
  const map = new Map<string, ClientSession[]>();
  for (const s of sessions) {
    const k = timeKey(s.scheduled_at);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(s);
  }
  return map;
}

function eventTop(session: ClientSession): number {
  const d = new Date(session.scheduled_at);
  return (d.getHours() - START_HOUR) * HOUR_HEIGHT + (d.getMinutes() / 60) * HOUR_HEIGHT;
}

function currentTimeTop(): number {
  const now = new Date();
  return (now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
}

// ── SessionModal ──────────────────────────────────────────────────────────────

function SessionModal({
  state, clients, colorMap, sessions, onSave, onDelete, onClose,
}: {
  state: ModalState;
  clients: ClientProfile[];
  colorMap: Record<string, string>;
  sessions: ClientSession[];
  onSave: (patch: { client_profile_id: string; scheduled_at: string; notes: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const active = clients.filter(c => c.is_active);
  const s = state.session;

  const [clientId, setClientId] = useState(s?.client_profile_id ?? active[0]?.id ?? '');
  const [date, setDate]   = useState(s ? toDateInput(new Date(s.scheduled_at)) : (state.defaults?.date ?? toDateInput(new Date())));
  const [time, setTime]   = useState(s ? fmtTime(s.scheduled_at) : (state.defaults?.time ?? '10:00'));
  const [notes, setNotes] = useState(s?.notes ?? '');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [conflictError, setConflictError] = useState('');

  useEffect(() => {
    if (!clientId && active.length > 0) setClientId(active[0].id);
  }, [active, clientId]);

  // Clear conflict error when user changes client or time
  useEffect(() => { setConflictError(''); }, [clientId, date, time]);

  // Detect if this session is part of a paired group (for display in edit mode)
  const isPairedSession = s
    ? sessions.filter(x => x.id !== s.id && timeKey(x.scheduled_at) === timeKey(s.scheduled_at)).length > 0
    : false;

  async function handleSave() {
    if (!clientId || !date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    // Block same client at same time (different session)
    const conflict = sessions.find(x =>
      x.client_profile_id === clientId &&
      timeKey(x.scheduled_at) === timeKey(scheduledAt) &&
      x.id !== s?.id,
    );
    if (conflict) {
      setConflictError('Клиент уже записан на это время');
      return;
    }

    setSaving(true);
    try {
      await onSave({ client_profile_id: clientId, scheduled_at: scheduledAt, notes: notes.trim() || null });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] bg-[var(--t-card)] rounded-t-3xl px-5 pt-3 pb-8 space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[var(--t-border3)] mx-auto mb-1" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--t-text)]">
              {state.mode === 'create' ? 'Новая тренировка' : 'Тренировка'}
            </h2>
            {isPairedSession && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6]">
                👥 Парная
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--t-faint)] hover:bg-[var(--t-hover)]">✕</button>
        </div>

        {/* Client chips */}
        <div>
          <p className="text-[10px] font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-2">Клиент</p>
          {active.length === 0 ? (
            <p className="text-sm text-[var(--t-muted)]">Нет активных клиентов</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {active.map(c => {
                const color = colorMap[c.id] ?? '#FF5722';
                const sel = clientId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setClientId(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all active:scale-95"
                    style={{
                      borderColor: sel ? color : 'var(--t-border)',
                      backgroundColor: sel ? `${color}20` : 'transparent',
                      color: sel ? color : 'var(--t-muted)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date + time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-1.5">Дата</p>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF5722] transition-colors"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-1.5">Время</p>
            <input
              type="time" value={time} onChange={e => setTime(e.target.value)} step={900}
              className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF5722] transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-1.5">Заметка</p>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Программа тренировки, цели..."
            rows={2}
            className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FF5722] resize-none placeholder:text-[var(--t-icon)] transition-colors"
          />
        </div>

        {/* Conflict error */}
        {conflictError && (
          <p className="text-xs text-red-400 -mt-1">{conflictError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {state.mode === 'edit' && (
            <button
              onClick={handleDelete} disabled={deleting}
              className="px-4 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium disabled:opacity-50 hover:bg-red-500/10 transition-colors active:scale-95"
            >
              {deleting ? '…' : 'Удалить'}
            </button>
          )}
          <button
            onClick={handleSave} disabled={saving || !clientId}
            className="flex-1 py-3 rounded-xl bg-[#FF5722] text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MonthView ─────────────────────────────────────────────────────────────────

function MonthView({
  anchor, sessions, clients, colorMap, onDayClick, onSessionClick,
}: {
  anchor: Date;
  sessions: ClientSession[];
  clients: ClientProfile[];
  colorMap: Record<string, string>;
  onDayClick: (d: Date) => void;
  onSessionClick: (s: ClientSession) => void;
}) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1);
  const startPad = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    const date = new Date(year, month, dayNum);
    return { date, inMonth: dayNum >= 1 && dayNum <= daysInMonth };
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* DOW header */}
      <div className="grid grid-cols-7 border-b border-[var(--t-hover)] shrink-0">
        {DOW_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-[var(--t-faint)] uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7">
          {cells.map(({ date, inMonth }) => {
            const daySess = sessionsForDay(sessions, date);
            const isToday = isSameDay(date, today);
            const isPast  = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={date.toISOString()}
                onClick={() => inMonth && onDayClick(date)}
                className={`min-h-[76px] p-1 border-b border-r border-[var(--t-hover)] transition-colors
                  ${inMonth ? 'cursor-pointer hover:bg-[var(--t-hover)]' : 'opacity-25 pointer-events-none'}
                  ${isPast && inMonth ? 'opacity-50' : ''}`}
              >
                {/* Day number */}
                <div className="flex justify-center mb-0.5">
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium leading-none
                    ${isToday ? 'bg-[#FF5722] text-white font-bold' : 'text-[var(--t-sub)]'}`}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Event chips — max 2 */}
                {(() => {
                  const groups = groupByMinute(daySess);
                  return daySess.slice(0, 2).map(s => {
                    const color = colorMap[s.client_profile_id] ?? '#FF5722';
                    const isPaired = (groups.get(timeKey(s.scheduled_at))?.length ?? 1) > 1;
                    return (
                      <div
                        key={s.id}
                        onClick={e => { e.stopPropagation(); onSessionClick(s); }}
                        style={{ color }}
                        className="flex items-center gap-0.5 text-[10px] font-medium leading-none py-0.5 px-0.5 rounded truncate"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                        {isPaired && <span className="text-[8px] shrink-0">👥</span>}
                        <span className="truncate">{fmtTime(s.scheduled_at)}</span>
                      </div>
                    );
                  });
                })()}
                {daySess.length > 2 && (
                  <div className="text-[9px] text-[var(--t-faint)] px-0.5">+{daySess.length - 2}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── TimeGrid (shared by 3-day and day views) ──────────────────────────────────

function TimeGrid({
  days, sessions, clients, colorMap, onSlotClick, onSessionClick,
}: {
  days: Date[];
  sessions: ClientSession[];
  clients: ClientProfile[];
  colorMap: Record<string, string>;
  onSlotClick: (date: Date, hour: number, min: number) => void;
  onSessionClick: (s: ClientSession) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const [nowTop, setNowTop] = useState(currentTimeTop);

  useEffect(() => {
    const interval = setInterval(() => setNowTop(currentTimeTop()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 120);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, date: Date) {
    if ((e.target as HTMLElement).closest('[data-sid]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMin = (y / HOUR_HEIGHT) * 60 + START_HOUR * 60;
    const snapped  = Math.round(totalMin / 15) * 15;
    const hour = Math.floor(snapped / 60);
    const min  = snapped % 60;
    if (hour < START_HOUR || hour >= END_HOUR) return;
    onSlotClick(date, hour, Math.min(min, 59));
  }

  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + START_HOUR);

  return (
    <div className="flex-1 overflow-hidden">
      <div ref={scrollRef} className="h-full overflow-y-auto">
        <div className="flex" style={{ height: GRID_HEIGHT }}>

          {/* Time labels column */}
          <div className="w-11 shrink-0 relative select-none">
            {hourLabels.map(h => (
              <div
                key={h}
                className="absolute right-0 w-10 text-[10px] text-[var(--t-faint)] text-right pr-1.5 leading-none"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 6 }}
              >
                {h < END_HOUR ? `${h}:00` : ''}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const daySess = sessionsForDay(sessions, day);
            const isToday = isSameDay(day, today);
            const showNow = isToday && nowTop >= 0 && nowTop <= GRID_HEIGHT;

            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative border-l border-[var(--t-hover)] cursor-pointer"
                onClick={e => handleColumnClick(e, day)}
              >
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => i).map(i => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-[var(--t-hover)]"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time indicator */}
                {showNow && (
                  <div
                    className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}

                {/* Events — paired sessions rendered side-by-side */}
                {(() => {
                  const timeGroups = groupByMinute(daySess);
                  return daySess.map(sess => {
                    const top = eventTop(sess);
                    if (top < 0 || top >= GRID_HEIGHT) return null;
                    const color  = colorMap[sess.client_profile_id] ?? '#FF5722';
                    const client = clients.find(c => c.id === sess.client_profile_id);
                    const height = Math.max(HOUR_HEIGHT - 4, 28);

                    const group    = timeGroups.get(timeKey(sess.scheduled_at))!;
                    const colIdx   = group.indexOf(sess);
                    const totalCols = group.length;
                    const isPaired  = totalCols > 1;

                    // Split column: each session gets an equal horizontal slice
                    const leftPct  = (colIdx / totalCols) * 100;
                    const rightPct = ((totalCols - colIdx - 1) / totalCols) * 100;

                    return (
                      <div
                        key={sess.id}
                        data-sid={sess.id}
                        onClick={e => { e.stopPropagation(); onSessionClick(sess); }}
                        style={{
                          top, height,
                          left: `calc(${leftPct}% + 2px)`,
                          right: `calc(${rightPct}% + 2px)`,
                          backgroundColor: `${color}18`,
                          borderLeftColor: color,
                        }}
                        className="absolute border-l-[3px] rounded-r-lg px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
                      >
                        <div className="text-[11px] font-semibold leading-tight truncate flex items-center gap-0.5" style={{ color }}>
                          {isPaired && <span className="text-[9px] shrink-0">👥</span>}
                          <span className="truncate">{client?.name ?? '—'}</span>
                        </div>
                        <div className="text-[10px] leading-tight opacity-80 truncate" style={{ color }}>
                          {fmtTime(sess.scheduled_at)}
                        </div>
                        {sess.notes && days.length === 1 && !isPaired && (
                          <div className="text-[10px] text-[var(--t-faint)] truncate mt-0.5">{sess.notes}</div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── CalendarClient ────────────────────────────────────────────────────────────

export default function CalendarClient({ userId }: { userId: string }) {
  const router = useRouter();

  const [view,     setView]     = useState<CalendarView>('month');
  const [anchor,   setAnchor]   = useState(() => new Date());
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [clients,  setClients]  = useState<ClientProfile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<ModalState | null>(null);

  const colorMap = useMemo(() => buildColorMap(clients), [clients]);

  // ── Load data ──

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });

    Promise.all([
      getClientsCached(userId),
      getSessionsCached(userId),
    ]).then(([c, s]) => {
      setClients(c);
      setSessions(s);
      setLoading(false);
    });

    // Force-refresh clients from Supabase — ensures deleted clients are removed
    // and we have valid IDs before creating sessions (prevents FK error 23503)
    refreshClients(userId).then(setClients).catch(() => {});
    refreshSessions(userId).then(setSessions).catch(() => {});
  }, [userId, router]);

  // ── Navigation ──

  const prevPeriod = useCallback(() => {
    setAnchor(a => {
      const d = new Date(a);
      if (view === 'month')      d.setMonth(d.getMonth() - 1);
      else if (view === '3day')  d.setDate(d.getDate() - 3);
      else                       d.setDate(d.getDate() - 1);
      return d;
    });
  }, [view]);

  const nextPeriod = useCallback(() => {
    setAnchor(a => {
      const d = new Date(a);
      if (view === 'month')      d.setMonth(d.getMonth() + 1);
      else if (view === '3day')  d.setDate(d.getDate() + 3);
      else                       d.setDate(d.getDate() + 1);
      return d;
    });
  }, [view]);

  function goToday() { setAnchor(new Date()); }

  // ── Title ──

  function getTitle(): string {
    if (view === 'month') return `${MONTHS_RU[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (view === 'day')   return `${fmtDow(anchor)}, ${anchor.getDate()} ${MONTHS_SHORT[anchor.getMonth()]}`;
    const end = addDays(anchor, 2);
    if (anchor.getMonth() === end.getMonth()) {
      return `${anchor.getDate()}–${end.getDate()} ${MONTHS_SHORT[anchor.getMonth()]}`;
    }
    return `${anchor.getDate()} ${MONTHS_SHORT[anchor.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
  }

  // ── Days for time grid ──

  const viewDays = view === '3day'
    ? [anchor, addDays(anchor, 1), addDays(anchor, 2)]
    : [anchor];

  // ── CRUD ──

  async function handleSave(patch: { client_profile_id: string; scheduled_at: string; notes: string | null }) {
    if (modal?.mode === 'edit' && modal.session) {
      const updated = await updateSession(modal.session.id, patch);
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    } else {
      const created = await createSession({ ...patch, user_id: userId });
      setSessions(prev => [...prev, created]);
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!modal?.session) return;
    await deleteSession(modal.session.id);
    setSessions(prev => prev.filter(s => s.id !== modal.session!.id));
    setModal(null);
  }

  function openNew(date: Date, hour = 10, min = 0) {
    setModal({
      mode: 'create',
      defaults: {
        date: toDateInput(date),
        time: `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      },
    });
  }

  const today = new Date();

  // ── Render ──

  return (
    <div style={{ height: '100dvh' }} className="flex flex-col bg-[var(--t-bg)]">

      {/* ── Header ── */}
      <div className="shrink-0 bg-[var(--t-bg)] border-b border-[var(--t-hover)] z-20">
        {/* Row 1: back + view switcher */}
        <div className="flex items-center gap-1 px-3 pt-2 pb-1">
          <Link
            href="/clients"
            className="flex items-center gap-1 h-9 pl-1 pr-2 rounded-xl text-[var(--t-muted)] hover:text-[var(--t-text)] transition-colors text-sm font-medium shrink-0"
          >
            <span className="text-lg leading-none">‹</span>
            <span>Назад</span>
          </Link>

          <div className="flex-1" />

          {/* View switcher */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--t-border)]">
            {(['month', '3day', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  view === v ? 'bg-[#FF5722] text-white' : 'text-[var(--t-muted)] hover:text-[var(--t-text)]'
                }`}
              >
                {v === 'month' ? 'Месяц' : v === '3day' ? '3 дня' : 'День'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: prev / title / next / today */}
        <div className="flex items-center gap-1 px-3 pb-2">
          <button
            onClick={prevPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--t-muted)] hover:bg-[var(--t-hover)] transition-colors text-lg"
          >‹</button>

          <button
            onClick={goToday}
            className="flex-1 text-center text-sm font-semibold text-[var(--t-text)] truncate"
          >
            {getTitle()}
          </button>

          <button
            onClick={nextPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--t-muted)] hover:bg-[var(--t-hover)] transition-colors text-lg"
          >›</button>

          <button
            onClick={goToday}
            className="text-[11px] font-semibold text-[#FF5722] px-2 py-1 rounded-lg hover:bg-[#FF5722]/10 transition-colors ml-1"
          >
            Сегодня
          </button>
        </div>

        {/* Row 3: day column headers (3-day / day only) */}
        {view !== 'month' && (
          <div className="flex border-t border-[var(--t-hover)]">
            <div className="w-11 shrink-0" />
            {viewDays.map(day => {
              const isToday = isSameDay(day, today);
              return (
                <div key={day.toISOString()} className="flex-1 py-1.5 text-center">
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-[#FF5722]' : 'text-[var(--t-faint)]'}`}>
                    {fmtDow(day)}
                  </div>
                  <div className={`text-xl font-bold leading-snug ${isToday ? 'text-[#FF5722]' : 'text-[var(--t-text)]'}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--t-faint)] text-sm">
            Загрузка…
          </div>
        ) : view === 'month' ? (
          <MonthView
            anchor={anchor}
            sessions={sessions}
            clients={clients}
            colorMap={colorMap}
            onDayClick={d => { setAnchor(d); setView('day'); }}
            onSessionClick={s => setModal({ mode: 'edit', session: s })}
          />
        ) : (
          <TimeGrid
            key={view}
            days={viewDays}
            sessions={sessions}
            clients={clients}
            colorMap={colorMap}
            onSlotClick={(d, h, m) => openNew(d, h, m)}
            onSessionClick={s => setModal({ mode: 'edit', session: s })}
          />
        )}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pointer-events-none">
        <div className="flex justify-end">
          <button
            onClick={() => openNew(view === 'month' ? today : anchor)}
            className="pointer-events-auto w-14 h-14 rounded-2xl bg-[#FF5722] text-white text-2xl shadow-lg shadow-[#FF5722]/30 flex items-center justify-center active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <SessionModal
          state={modal}
          clients={clients}
          colorMap={colorMap}
          sessions={sessions}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
