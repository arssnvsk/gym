'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Exercise, WorkoutSet } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  lastSet?: WorkoutSet;
  layout?: 'list' | 'grid';
}

export default function ExerciseCard({ exercise, lastSet, layout = 'list' }: ExerciseCardProps) {
  const t = useTranslations();

  if (layout === 'grid') {
    return (
      <Link
        href={`/exercise/${exercise.id}`}
        className="block bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 hover:border-[#FF5722]/50 hover:bg-[#1A1A1A] transition-all active:scale-95"
      >
        <span className="text-2xl block mb-3">{exercise.icon}</span>
        <h3 className="text-sm font-semibold text-white leading-tight mb-2">
          {t(exercise.nameKey)}
        </h3>
        {lastSet ? (
          <div className="flex items-center gap-1.5 text-xs text-[#888]">
            {lastSet.weight > 0 && (
              <><span className="text-[#FF5722] font-bold text-sm">{lastSet.weight}</span><span>{t('home.kg')}</span><span className="text-[#555]">·</span></>
            )}
            <span>{lastSet.reps}</span>
            <span>{t('home.lastReps')}</span>
          </div>
        ) : (
          <span className="text-xs text-[#444]">{t('home.noData')}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/exercise/${exercise.id}`}
      className="flex items-center gap-3 bg-[#141414] border border-[#1F1F1F] rounded-xl px-3 py-2.5 hover:border-[#FF5722]/40 hover:bg-[#1A1A1A] transition-all active:scale-95"
    >
      <span className="text-xl leading-none shrink-0">{exercise.icon}</span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-white leading-tight truncate">
          {t(exercise.nameKey)}
        </h3>
        {lastSet ? (
          <div className="flex items-center gap-1 text-xs text-[#555] mt-0.5">
            {lastSet.weight > 0 && <><span className="text-[#FF5722] font-semibold">{lastSet.weight}</span><span>{t('home.kg')}</span><span className="mx-0.5">·</span></>}
            <span>{lastSet.reps}</span>
            <span>{t('home.lastReps')}</span>
          </div>
        ) : (
          <span className="text-xs text-[#333] mt-0.5 block">{t('home.noData')}</span>
        )}
      </div>
    </Link>
  );
}
