'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import ExerciseCard from '@/components/ExerciseCard';
import AddSetModal from '@/components/AddSetModal';
import StopwatchModal from '@/components/StopwatchModal';
import { CATEGORY_ORDER } from '@/lib/exercises';
import { getLastSetPerExercise, getLastSetPerExerciseCached } from '@/lib/sets';
import { getStreakCached, getDayStatsCached, type DayStats, type ExerciseTrend } from '@/lib/day';
import { type UserPreferences } from '@/lib/preferences';
import { type ReadinessInfo } from '@/lib/insights';
import { useClient } from '@/components/ClientProvider';
import type { WorkoutSet, Exercise } from '@/types';

function pluralWorkouts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'тренировка';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'тренировки';
  return 'тренировок';
}

function pluralSets(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'подход';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'подхода';
  return 'подходов';
}

function formatVolumeSm(volume: number, isBodyweight: boolean): string {
  if (isBodyweight) return `${volume}\u00a0раз`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}\u00a0т`;
  return `${Math.round(volume)}\u00a0кг`;
}

function getTodayDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

const TREND_COLORS: Record<Exclude<ExerciseTrend, 'new'>, string> = {
  progress: 'text-green-400', regression: 'text-red-400', neutral: 'text-[var(--t-faint)]',
};
const TREND_ICONS: Record<Exclude<ExerciseTrend, 'new'>, string> = {
  progress: '↑', regression: '↓', neutral: '→',
};

function TodayTrendBadge({ trend, changePercent }: { trend: ExerciseTrend; changePercent: number | null }) {
  if (trend === 'new') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/25 leading-none">
        ★
      </span>
    );
  }
  const sign = changePercent !== null && changePercent > 0 ? '+' : '';
  const pct = changePercent !== null ? `\u00a0${sign}${changePercent}%` : '';
  return (
    <span className={`text-xs font-semibold tabular-nums ${TREND_COLORS[trend]}`}>
      {TREND_ICONS[trend]}{pct}
    </span>
  );
}

function formatTimeShort(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}с`;
}


export default function HomeClient({ initialPreferences, initialStreak, initialReadiness, initialTodayStats, initialExercises }: {
  initialPreferences: UserPreferences;
  initialStreak: number;
  initialReadiness: ReadinessInfo | null;
  initialTodayStats: DayStats | null;
  initialExercises: Exercise[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const { activeClient } = useClient();
  const clientProfileId = activeClient?.id ?? null;
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSets, setLastSets] = useState<Record<string, WorkoutSet>>({});
  const [query, setQuery] = useState('');
  const [streak, setStreak] = useState(initialStreak);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  const [todayStats, setTodayStats] = useState<DayStats | null>(initialTodayStats);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [layout] = useState(initialPreferences.exerciseLayout);

  // Pick one exercise per ready/fresh muscle group, prefer those with history
  const suggestedExercises = useMemo(() => {
    if (!initialReadiness) return [];
    const muscles = [...initialReadiness.fresh, ...initialReadiness.ready].slice(0, 6);
    const seen = new Set<string>();
    const result = [];
    for (const muscle of muscles) {
      const withHistory = initialExercises.filter(ex => ex.muscles.primary.includes(muscle) && lastSets[ex.id]);
      const withoutHistory = initialExercises.filter(ex => ex.muscles.primary.includes(muscle) && !lastSets[ex.id]);
      const pick = [...withHistory, ...withoutHistory].find(ex => !seen.has(ex.id));
      if (pick) { seen.add(pick.id); result.push(pick); }
      if (result.length >= 5) break;
    }
    return result;
  }, [initialReadiness, lastSets]);

  // Stopwatch
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(baseElapsedRef.current + Date.now() - startedAtRef.current!);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  function handleStart() {
    startedAtRef.current = Date.now();
    setRunning(true);
  }
  function handlePause() {
    baseElapsedRef.current = elapsed;
    setRunning(false);
  }
  function handleReset() {
    setRunning(false);
    baseElapsedRef.current = 0;
    setElapsed(0);
  }

  const loadLastSets = useCallback(async () => {
    const today = getTodayDate();

    // Show cached data from IndexedDB immediately — no network needed
    const cached = await getLastSetPerExerciseCached(clientProfileId);
    setLastSets(cached);
    getStreakCached(clientProfileId).then(setStreak);
    getDayStatsCached(today, clientProfileId).then(setTodayStats);

    // Refresh from Supabase silently in background
    try {
      const fresh = await getLastSetPerExercise(clientProfileId); // also upserts to IndexedDB
      setLastSets(fresh);
      getStreakCached(clientProfileId).then(setStreak);
      getDayStatsCached(today, clientProfileId).then(setTodayStats); // re-read after IndexedDB is fresh
    } catch {
      // silently fail — cached data is already shown
    }
  }, [clientProfileId]);

  useEffect(() => {
    // Auth check reads from localStorage — no network, instant
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
      }
    });

    loadLastSets();
  }, [loadLastSets, router]);

  const q = query.trim().toLowerCase();
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    exercises: initialExercises.filter((ex) =>
      ex.category === cat && (!q || ex.name.toLowerCase().includes(q))
    ),
  })).filter(({ exercises }) => exercises.length > 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />

      <main className="flex-1 px-4 pb-28 pt-4">
        {/* Streak */}
        {streak > 0 && (
          <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">🔥</span>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[var(--t-text)]">{streak}</span>
                    <span className="text-sm text-[var(--t-muted)]">{pluralWorkouts(streak)} подряд</span>
                  </div>
                  <p className="text-xs text-[var(--t-faint)] mt-0.5">Серия тренировок</p>
                </div>
              </div>
              <button
                onClick={() => setStreakInfoOpen(v => !v)}
                className="w-7 h-7 flex items-center justify-center text-[var(--t-icon)] hover:text-[var(--t-muted)] transition-colors text-base rounded-lg hover:bg-[var(--t-overlay)]"
                aria-label="Как считается серия"
              >
                ⓘ
              </button>
            </div>
            {streakInfoOpen && (
              <p className="mt-3 pt-3 border-t border-[var(--t-border)] text-xs text-[#666] leading-relaxed">
                Серия не сбрасывается, если между тренировками не более 2 дней отдыха — как обычно бывает при тренировках через день. Пропустил 3 и более дней — серия обнуляется.
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--t-icon)] text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.search')}
            className="w-full bg-[var(--t-card)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#FF5722] transition-colors placeholder:text-[var(--t-icon)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--t-icon)] hover:text-[var(--t-text)] transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Прогресс сегодня */}
        {todayStats && !q && (
          <section className="mb-5">
            <div className="flex items-center justify-between py-2 mb-1">
              <span className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider">Прогресс сегодня</span>
              <Link href="/day" className="text-xs text-[#FF5722] hover:text-[#FF6D3A] transition-colors">
                Подробнее →
              </Link>
            </div>
            <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl overflow-hidden">
              {todayStats.exerciseStats.map((stat, i) => (
                <Link
                  key={stat.exercise.id}
                  href={`/exercise/${stat.exercise.id}`}
                  className={`flex items-center justify-between px-3 py-2.5 gap-3 hover:bg-[var(--t-hover)] active:opacity-70 transition-all ${
                    i > 0 ? 'border-t border-[var(--t-hover)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none shrink-0">{stat.exercise.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--t-text)] truncate">{stat.exercise.name}</div>
                      <div className="text-[11px] text-[var(--t-faint)]">{stat.todaySets} {pluralSets(stat.todaySets)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[var(--t-faint)] tabular-nums">
                      {formatVolumeSm(stat.todayVolume, stat.isBodyweight)}
                    </span>
                    <TodayTrendBadge trend={stat.trend} changePercent={stat.changePercent} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* На сегодня — только для тренера (рекомендации основаны на его данных) */}
        {suggestedExercises.length > 0 && !clientProfileId && (
          <section className="mb-2">
            <div className="flex items-center justify-between py-2 mb-1">
              <span className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider">На сегодня</span>
            </div>
            <div className={`grid gap-1.5 mb-4 ${layout === 'grid' ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
              {suggestedExercises.map(ex => (
                <ExerciseCard key={ex.id} exercise={ex} lastSet={lastSets[ex.id]} layout={layout} />
              ))}
            </div>
          </section>
        )}

        {grouped.map(({ category, exercises }) => {
          const isCollapsed = collapsedCategories.has(category);
          return (
            <section key={category} className="mb-2">
              <button
                onClick={() => setCollapsedCategories(prev => {
                  const next = new Set(prev);
                  if (next.has(category)) next.delete(category); else next.add(category);
                  return next;
                })}
                className="w-full flex items-center justify-between py-2 mb-1 active:opacity-70 transition-opacity"
              >
                <span className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider">
                  {t(`categories.${category}`)}
                </span>
                <div className="flex items-center gap-1.5">
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`text-[var(--t-icon)] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  >
                    <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              {!isCollapsed && (
                <div className={`grid gap-1.5 mb-4 ${layout === 'grid' ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
                  {exercises.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      lastSet={lastSets[ex.id]}
                      layout={layout}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 flex gap-3">
        {/* Stopwatch */}
        <button
          onClick={() => setShowStopwatch(true)}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all active:scale-95 border ${
            running
              ? 'bg-[#FF5722]/10 border-[#FF5722]/40 text-[#FF5722] shadow-lg shadow-[#FF5722]/20 w-20'
              : 'bg-[var(--t-card)] border-[var(--t-border)] text-[var(--t-muted)] hover:text-[var(--t-text)] hover:border-[var(--t-border3)] w-14'
          }`}
        >
          <span className="text-xl leading-none">⏱</span>
          {running && (
            <span className="text-[10px] font-mono font-semibold tabular-nums leading-none">
              {formatTimeShort(elapsed)}
            </span>
          )}
        </button>

        {/* Add set */}
        <button
          onClick={() => setShowModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#FF5722] hover:bg-[#FF6D3A] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-[#FF5722]/30 transition-all active:scale-95 text-base"
        >
          <span className="text-xl">+</span>
          {t('home.addSet')}
        </button>
      </div>

      {showModal && user && (
        <AddSetModal
          onClose={() => setShowModal(false)}
          onSuccess={loadLastSets}
          userId={user.id}
          exercises={initialExercises}
          clientProfileId={clientProfileId}
        />
      )}

      {showStopwatch && (
        <StopwatchModal
          elapsed={elapsed}
          running={running}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onClose={() => setShowStopwatch(false)}
        />
      )}
    </div>
  );
}
