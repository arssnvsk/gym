'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { addSet, updateSet } from '@/lib/sets';
import type { WorkoutSet, Exercise } from '@/types';

interface AddSetModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  exercises: Exercise[];
  defaultExerciseId?: string;
  existingSet?: WorkoutSet;
  clientProfileId?: string | null;
}

export default function AddSetModal({ onClose, onSuccess, userId, exercises, defaultExerciseId, existingSet, clientProfileId }: AddSetModalProps) {
  const t = useTranslations();
  const editMode = !!existingSet;
  const [exerciseId, setExerciseId] = useState(defaultExerciseId ?? '');
  const [weight, setWeight] = useState(existingSet ? String(existingSet.weight) : '');
  const [reps, setReps] = useState(existingSet ? String(existingSet.reps) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight || !reps) return;

    setLoading(true);
    setError('');

    try {
      if (editMode) {
        await updateSet(existingSet.id, {
          weight: parseFloat(weight),
          reps: parseInt(reps, 10),
        });
      } else {
        if (!exerciseId) return;
        await addSet({
          exercise_id: exerciseId,
          weight: parseFloat(weight),
          reps: parseInt(reps, 10),
        }, userId, clientProfileId);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[var(--t-card)] border border-[var(--t-border)] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--t-text)]">{editMode ? t('addSet.editTitle') : t('addSet.title')}</h2>
          <button
            onClick={onClose}
            className="text-[var(--t-faint)] hover:text-[var(--t-text)] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--t-border)] transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exercise select — only in add mode */}
          {!editMode && (
            <div>
              <label className="block text-xs text-[var(--t-muted)] mb-1.5 font-medium">
                {t('addSet.exercise')}
              </label>
              <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                required
                className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5722] transition-colors appearance-none"
              >
                <option value="" disabled className="text-[var(--t-faint)]">
                  {t('addSet.selectExercise')}
                </option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.icon} {ex.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Weight + Reps row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--t-muted)] mb-1.5 font-medium">
                {t('addSet.weight')}
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                min="0"
                step="0.5"
                placeholder="100"
                className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5722] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--t-muted)] mb-1.5 font-medium">
                {t('addSet.reps')}
              </label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
                min="1"
                step="1"
                placeholder="8"
                className="w-full bg-[var(--t-bg)] border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5722] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[var(--t-border)] text-[var(--t-muted)] text-sm font-medium hover:bg-[var(--t-border)] transition-colors"
            >
              {t('addSet.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || (!editMode && !exerciseId) || !weight || !reps}
              className="flex-1 py-3 rounded-xl bg-[#FF5722] text-white text-sm font-semibold hover:bg-[#FF6D3A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('addSet.saving') : editMode ? t('addSet.saveEdit') : t('addSet.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
