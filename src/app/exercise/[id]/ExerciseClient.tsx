'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Exercise, WorkoutSet } from '@/types';
import { getSetsByExercise, getSetsByExerciseCached, toVolumeChartData, getPersonalRecord, deleteSet } from '@/lib/sets';
import { createClient } from '@/lib/supabase/client';
import ProgressChart from '@/components/ProgressChart';
import AddSetModal from '@/components/AddSetModal';
import MuscleMap from '@/components/MuscleMap';
import { useClient } from '@/components/ClientProvider';
import ClientBanner from '@/components/ClientBanner';

interface ExerciseClientProps {
  exercise: Exercise;
}

export default function ExerciseClient({ exercise }: ExerciseClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const { activeClient } = useClient();
  const clientProfileId = activeClient?.id ?? null;
  const [userId, setUserId] = useState<string | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const loadSets = useCallback(async () => {
    // Show cached data from IndexedDB immediately — no skeleton needed
    const cached = await getSetsByExerciseCached(exercise.id, clientProfileId);
    if (cached.length > 0) {
      setSets(cached);
      setLoading(false);
    }

    // Refresh from Supabase silently in background
    try {
      const fresh = await getSetsByExercise(exercise.id, clientProfileId);
      setSets(fresh);
    } finally {
      setLoading(false);
    }
  }, [exercise.id, clientProfileId]);

  useEffect(() => {
    // Auth check reads from localStorage — instant, no network needed
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUserId(session.user.id);
      }
    });

    // Load sets in parallel — doesn't need userId (Supabase RLS + IndexedDB handle it)
    loadSets();
  }, [loadSets, router]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteSet(id);
      await loadSets();
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  }

  const volumeData = toVolumeChartData(sets);
  const pr = getPersonalRecord(sets);

  function getTrend(data: { value: number }[]) {
    if (data.length < 2) return null;
    const last = data[data.length - 1].value;
    const prev = data[data.length - 2].value;
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'flat';
  }

  const volumeTrend = getTrend(volumeData);

  function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' | null }) {
    if (!trend) return null;
    if (trend === 'up') return (
      <span className="text-xs bg-green-900/30 text-green-400 border border-green-900/50 px-2 py-0.5 rounded-full">
        ↑ {t('exercise.progress')}
      </span>
    );
    if (trend === 'down') return (
      <span className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-0.5 rounded-full">
        ↓ {t('exercise.regression')}
      </span>
    );
    return <span className="text-xs text-[var(--t-faint)]">→</span>;
  }

  // Group sets by day, most recent first, last 10 days
  const groupedByDay: { date: string; label: string; volume: number; daySets: typeof sets }[] = [];
  let firstDate: string | null = null;
  {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

    const byDate = new Map<string, typeof sets>();
    for (const s of [...sets].reverse()) {
      const d = s.created_at.slice(0, 10);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(s);
    }

    const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a)).slice(0, 10);
    for (const d of sortedDates) {
      const daySets = byDate.get(d)!;
      const dt = new Date(d + 'T12:00:00');
      const label = d === todayStr ? 'Сегодня'
        : d === yesterdayStr ? 'Вчера'
        : `${dt.getDate()} ${MONTHS[dt.getMonth()]}${dt.getFullYear() !== today.getFullYear() ? ' ' + dt.getFullYear() : ''}`;
      const allBodyweight = daySets.every(s => s.weight === 0);
      const volume = daySets.reduce((acc, s) => acc + (allBodyweight ? s.reps : s.weight * s.reps), 0);
      groupedByDay.push({ date: d, label, volume, daySets });
      if (firstDate === null) firstDate = d;
    }
  }

  // Auto-expand the most recent day on first render
  if (firstDate !== null && expandedDates.size === 0) {
    expandedDates.add(firstDate);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <header className="flex items-center gap-3 px-4 py-1 bg-[var(--t-bg-alpha)] backdrop-blur-md border-b border-[var(--t-border)]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 h-11 pl-1 pr-3 -ml-1 rounded-xl text-[var(--t-muted)] hover:text-[var(--t-text)] active:bg-[var(--t-overlay)] transition-colors text-sm font-medium"
          >
            <span className="text-lg leading-none">‹</span>
            <span>{t('exercise.backToHome')}</span>
          </button>
        </header>
        <ClientBanner />
      </div>

      <main className="flex-1 px-4 py-5 pb-28 space-y-5">
        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{exercise.icon}</span>
          <h1 className="text-xl font-bold text-[var(--t-text)]">{t(exercise.nameKey)}</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Muscle map — always visible */}
            <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[var(--t-text)] mb-4">{t('exercise.muscles')}</p>
              <MuscleMap
                primary={exercise.muscles.primary}
                secondary={exercise.muscles.secondary}
              />
            </div>

            {sets.length === 0 ? (
              <div className="text-center py-10 text-[var(--t-faint)]">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm">{t('exercise.noData')}</p>
              </div>
            ) : (<>
            {/* PR + Volume row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Personal Record */}
              {pr && (
                <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl p-4">
                  <p className="text-xs text-[var(--t-faint)] uppercase tracking-wider mb-1">{t('exercise.pr')}</p>
                  <p className="text-2xl font-bold text-[var(--t-text)]">
                    {pr.weight}
                    <span className="text-sm font-normal text-[#FF5722] ml-1">{t('exercise.chartKg')}</span>
                  </p>
                  <p className="text-xs text-[var(--t-faint)] mt-1">
                    {new Date(pr.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Last session volume */}
              {volumeData.length > 0 && (
                <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl p-4">
                  <p className="text-xs text-[var(--t-faint)] uppercase tracking-wider mb-1">{t('exercise.lastVolume')}</p>
                  <p className="text-2xl font-bold text-[var(--t-text)]">
                    {volumeData[volumeData.length - 1].value.toLocaleString('ru-RU')}
                    <span className="text-sm font-normal text-[#FF8A65] ml-1">{t('exercise.chartKg')}</span>
                  </p>
                  <p className="text-xs text-[var(--t-faint)] mt-1">{t('exercise.volumeHint')}</p>
                </div>
              )}
            </div>

            {/* Volume chart */}
            <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[var(--t-text)]">{t('exercise.volumeChart')}</span>
                <TrendBadge trend={volumeTrend} />
              </div>
              <ProgressChart
                data={volumeData}
                label={`${t('exercise.volumeChart')}, ${t('exercise.chartKg')}`}
                unit={t('exercise.chartKg')}
                color="#FF5722"
              />
            </div>

            {/* History grouped by day */}
            <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--t-border)]">
                <h2 className="text-sm font-semibold text-[var(--t-text)]">{t('exercise.history')}</h2>
              </div>
              {groupedByDay.map(({ date, label, volume, daySets }) => {
                const allBodyweight = daySets.every(s => s.weight === 0);
                const isOpen = expandedDates.has(date);
                function toggleDate() {
                  setExpandedDates(prev => {
                    const next = new Set(prev);
                    if (next.has(date)) next.delete(date); else next.add(date);
                    return next;
                  });
                }
                return (
                  <div key={date}>
                    {/* Day header — accordion trigger */}
                    <button
                      onClick={toggleDate}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[var(--t-inset)] border-b border-[var(--t-border)] active:bg-[var(--t-overlay)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} text-[var(--t-icon)]`}>▶</span>
                        <span className="text-xs font-semibold text-[var(--t-muted)] uppercase tracking-wider">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--t-faint)] tabular-nums">
                          {allBodyweight ? `${volume} повт.` : `${volume.toLocaleString('ru-RU')} кг`}
                        </span>
                        <span className="text-[11px] text-[var(--t-icon)]">{daySets.length} × </span>
                      </div>
                    </button>
                    {/* Sets — only when expanded */}
                    {isOpen && daySets.map((s, i) => {
                      const isConfirming = confirmDeleteId === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between px-4 py-3 transition-colors ${
                            i < daySets.length - 1 ? 'border-b border-[var(--t-hover)]' : ''
                          } ${isConfirming ? 'bg-red-950/20' : 'hover:bg-[var(--t-hover)]'}`}
                        >
                          <div className="flex items-center gap-1.5 text-sm">
                            {s.weight > 0 ? (
                              <>
                                <span className="text-[var(--t-text)] font-semibold">{s.weight}</span>
                                <span className="text-[var(--t-faint)] text-xs">{t('home.kg')}</span>
                                <span className="text-[var(--t-border3)] mx-0.5">×</span>
                              </>
                            ) : null}
                            <span className="text-[var(--t-text)] font-semibold">{s.reps}</span>
                            <span className="text-[var(--t-faint)] text-xs">{t('home.lastReps')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isConfirming ? (
                              <>
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  disabled={deleting}
                                  className="text-xs text-red-400 font-semibold hover:text-red-300 disabled:opacity-50 px-2 py-1"
                                >
                                  {deleting ? '…' : t('exercise.confirmDelete')}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs text-[var(--t-faint)] hover:text-[var(--t-text)] px-2 py-1"
                                >
                                  {t('exercise.cancelDelete')}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingSet(s)}
                                  className="w-7 h-7 flex items-center justify-center text-[var(--t-faint)] hover:text-[var(--t-text)] hover:bg-[var(--t-border)] rounded-lg transition-colors text-sm"
                                  title={t('exercise.editSet')}
                                >✎</button>
                                <button
                                  onClick={() => setConfirmDeleteId(s.id)}
                                  className="w-7 h-7 flex items-center justify-center text-[var(--t-faint)] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-sm"
                                  title={t('exercise.deleteSet')}
                                >✕</button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>)}
          </>
        )}
      </main>

      {/* FAB */}
      {userId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#FF5722] hover:bg-[#FF6D3A] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-[#FF5722]/30 transition-all active:scale-95 text-base"
          >
            <span className="text-xl">+</span>
            {t('home.addSet')}
          </button>
        </div>
      )}

      {showModal && userId && (
        <AddSetModal
          onClose={() => setShowModal(false)}
          onSuccess={loadSets}
          userId={userId}
          defaultExerciseId={exercise.id}
          clientProfileId={clientProfileId}
        />
      )}

      {editingSet && userId && (
        <AddSetModal
          onClose={() => setEditingSet(null)}
          onSuccess={loadSets}
          userId={userId}
          existingSet={editingSet}
          clientProfileId={clientProfileId}
        />
      )}
    </div>
  );
}
