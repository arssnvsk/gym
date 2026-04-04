'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import ExerciseCard from '@/components/ExerciseCard';
import AddSetModal from '@/components/AddSetModal';
import StopwatchModal from '@/components/StopwatchModal';
import { EXERCISES, CATEGORY_ORDER } from '@/lib/exercises';
import { getLastSetPerExercise, getLastSetPerExerciseCached } from '@/lib/sets';
import { getStreakCached } from '@/lib/day';
import { type UserPreferences } from '@/lib/preferences';
import { type ReadinessInfo } from '@/lib/insights';
import type { WorkoutSet } from '@/types';

function pluralWorkouts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'тренировка';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'тренировки';
  return 'тренировок';
}

function formatTimeShort(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}с`;
}


export default function HomeClient({ initialPreferences, initialStreak, initialReadiness }: {
  initialPreferences: UserPreferences;
  initialStreak: number;
  initialReadiness: ReadinessInfo | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastSets, setLastSets] = useState<Record<string, WorkoutSet>>({});
  const [query, setQuery] = useState('');
  const [streak, setStreak] = useState(initialStreak);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [layout] = useState(initialPreferences.exerciseLayout);

  // Pick one exercise per ready/fresh muscle group, prefer those with history
  const suggestedExercises = useMemo(() => {
    if (!initialReadiness) return [];
    const muscles = [...initialReadiness.fresh, ...initialReadiness.ready].slice(0, 6);
    const seen = new Set<string>();
    const result = [];
    for (const muscle of muscles) {
      const withHistory = EXERCISES.filter(ex => ex.muscles.primary.includes(muscle) && lastSets[ex.id]);
      const withoutHistory = EXERCISES.filter(ex => ex.muscles.primary.includes(muscle) && !lastSets[ex.id]);
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
    // Show cached data from IndexedDB immediately — no network needed
    const cached = await getLastSetPerExerciseCached();
    setLastSets(cached);
    getStreakCached().then(setStreak);

    // Refresh from Supabase silently in background
    try {
      const fresh = await getLastSetPerExercise();
      setLastSets(fresh);
      getStreakCached().then(setStreak);
    } catch {
      // silently fail — cached data is already shown
    }
  }, []);

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
    exercises: EXERCISES.filter((ex) =>
      ex.category === cat && (!q || t(ex.nameKey).toLowerCase().includes(q))
    ),
  })).filter(({ exercises }) => exercises.length > 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />

      <main className="flex-1 px-4 pb-28 pt-4">
        {/* Streak */}
        {streak > 0 && (
          <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">🔥</span>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white">{streak}</span>
                    <span className="text-sm text-[#888]">{pluralWorkouts(streak)} подряд</span>
                  </div>
                  <p className="text-xs text-[#555] mt-0.5">Серия тренировок</p>
                </div>
              </div>
              <button
                onClick={() => setStreakInfoOpen(v => !v)}
                className="w-7 h-7 flex items-center justify-center text-[#444] hover:text-[#888] transition-colors text-base rounded-lg hover:bg-white/5"
                aria-label="Как считается серия"
              >
                ⓘ
              </button>
            </div>
            {streakInfoOpen && (
              <p className="mt-3 pt-3 border-t border-[#1F1F1F] text-xs text-[#666] leading-relaxed">
                Серия не сбрасывается, если между тренировками не более 2 дней отдыха — как обычно бывает при тренировках через день. Пропустил 3 и более дней — серия обнуляется.
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.search')}
            className="w-full bg-[#141414] border border-[#1F1F1F] text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#FF5722] transition-colors placeholder:text-[#444]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* На сегодня */}
        {suggestedExercises.length > 0 && (
          <section className="mb-2">
            <div className="flex items-center justify-between py-2 mb-1">
              <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">На сегодня</span>
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
                <span className="text-xs font-semibold text-[#555] uppercase tracking-wider">
                  {t(`categories.${category}`)}
                </span>
                <div className="flex items-center gap-1.5">
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`text-[#444] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
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
              : 'bg-[#141414] border-[#1F1F1F] text-[#888] hover:text-white hover:border-[#333] w-14'
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
