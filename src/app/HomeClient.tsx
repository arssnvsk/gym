'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import ExerciseCard from '@/components/ExerciseCard';
import AddSetModal from '@/components/AddSetModal';
import StopwatchModal from '@/components/StopwatchModal';
import { EXERCISES, CATEGORY_ORDER } from '@/lib/exercises';
import { getLastSetPerExercise } from '@/lib/sets';
import type { WorkoutSet } from '@/types';

function formatTimeShort(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}с`;
}

interface HomeClientProps {
  user: User;
}

export default function HomeClient({ user }: HomeClientProps) {
  const t = useTranslations();
  const [showModal, setShowModal] = useState(false);
  const [lastSets, setLastSets] = useState<Record<string, WorkoutSet>>({});
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');

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
    try {
      const data = await getLastSetPerExercise();
      setLastSets(data);
    } catch {
      // silently fail
    }
    setLoaded(true);
  }, []);

  // Load on first render
  if (!loaded) {
    loadLastSets();
  }

  function handleSuccess() {
    loadLastSets();
  }

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

        {grouped.map(({ category, exercises }) => (
          <section key={category} className="mb-6">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
              {t(`categories.${category}`)}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  lastSet={lastSets[ex.id]}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 flex gap-3">
        {/* Stopwatch button */}
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

        <button
          onClick={() => setShowModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#FF5722] hover:bg-[#FF6D3A] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-[#FF5722]/30 transition-all active:scale-95 text-base"
        >
          <span className="text-xl">+</span>
          {t('home.addSet')}
        </button>
      </div>

      {showModal && (
        <AddSetModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
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
