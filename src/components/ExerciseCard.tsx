'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Exercise, WorkoutSet } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  lastSet?: WorkoutSet;
}

export default function ExerciseCard({ exercise, lastSet }: ExerciseCardProps) {
  const t = useTranslations();

  return (
    <Link
      href={`/exercise/${exercise.id}`}
      className="block bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 hover:border-[#FF5722]/50 hover:bg-[#1A1A1A] transition-all active:scale-95"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{exercise.icon}</span>
        <span className="text-xs text-[#555] bg-[#1F1F1F] px-2 py-0.5 rounded-full">
          {t(`categories.${exercise.category}`)}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-white leading-tight mb-2">
        {t(exercise.nameKey)}
      </h3>
      {lastSet ? (
        <div className="flex items-center gap-2 text-xs text-[#888]">
          <span className="text-[#FF5722] font-bold text-sm">{lastSet.weight}</span>
          <span>{t('home.kg')}</span>
          <span className="text-[#555]">·</span>
          <span>{lastSet.reps}</span>
          <span>{t('home.lastReps')}</span>
        </div>
      ) : (
        <span className="text-xs text-[#444]">{t('home.noData')}</span>
      )}
    </Link>
  );
}
