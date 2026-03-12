'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import ExerciseCard from '@/components/ExerciseCard';
import AddSetModal from '@/components/AddSetModal';
import { EXERCISES, CATEGORY_ORDER } from '@/lib/exercises';
import { getLastSetPerExercise } from '@/lib/sets';
import type { WorkoutSet } from '@/types';

interface HomeClientProps {
  user: User;
}

export default function HomeClient({ user }: HomeClientProps) {
  const t = useTranslations();
  const [showModal, setShowModal] = useState(false);
  const [lastSets, setLastSets] = useState<Record<string, WorkoutSet>>({});
  const [loaded, setLoaded] = useState(false);

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

  // Group exercises by category in desired order
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    exercises: EXERCISES.filter((ex) => ex.category === cat),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />

      <main className="flex-1 px-4 pb-28 pt-4">
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#FF5722] hover:bg-[#FF6D3A] text-white font-semibold py-4 rounded-2xl shadow-lg shadow-[#FF5722]/30 transition-all active:scale-95 text-base"
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
    </div>
  );
}
