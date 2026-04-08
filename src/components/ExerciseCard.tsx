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
        className="block bg-[var(--t-card)] border border-[var(--t-border)] rounded-xl p-2.5 hover:border-[#FF5722]/50 hover:bg-[var(--t-hover)] transition-all active:scale-95"
      >
        <span className="text-lg block mb-1.5">{exercise.icon}</span>
        <h3 className="text-xs font-semibold text-[var(--t-text)] leading-tight mb-1">
          {exercise.name}
        </h3>
        {lastSet ? (
          <div className="flex items-center gap-1 text-[11px] text-[var(--t-faint)]">
            {lastSet.weight > 0 && (
              <><span className="text-[#FF5722] font-semibold">{lastSet.weight}</span><span>{t('home.kg')}</span><span>·</span></>
            )}
            <span>{lastSet.reps}</span>
            <span>{t('home.lastReps')}</span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--t-border3)]">{t('home.noData')}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/exercise/${exercise.id}`}
      className="flex items-center gap-3 bg-[var(--t-card)] border border-[var(--t-border)] rounded-xl px-3 py-2.5 hover:border-[#FF5722]/40 hover:bg-[var(--t-hover)] transition-all active:scale-95"
    >
      <span className="text-xl leading-none shrink-0">{exercise.icon}</span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--t-text)] leading-tight truncate">
          {exercise.name}
        </h3>
        {lastSet ? (
          <div className="flex items-center gap-1 text-xs text-[var(--t-faint)] mt-0.5">
            {lastSet.weight > 0 && <><span className="text-[#FF5722] font-semibold">{lastSet.weight}</span><span>{t('home.kg')}</span><span className="mx-0.5">·</span></>}
            <span>{lastSet.reps}</span>
            <span>{t('home.lastReps')}</span>
          </div>
        ) : (
          <span className="text-xs text-[var(--t-border3)] mt-0.5 block">{t('home.noData')}</span>
        )}
      </div>
    </Link>
  );
}
