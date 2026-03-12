'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Exercise, WorkoutSet } from '@/types';
import { getSetsByExercise, toVolumeChartData, getPersonalRecord, deleteSet } from '@/lib/sets';
import ProgressChart from '@/components/ProgressChart';
import AddSetModal from '@/components/AddSetModal';
import MuscleMap from '@/components/MuscleMap';

interface ExerciseClientProps {
  exercise: Exercise;
  userId: string;
}

export default function ExerciseClient({ exercise, userId }: ExerciseClientProps) {
  const t = useTranslations();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSetsByExercise(exercise.id);
      setSets(data);
    } finally {
      setLoading(false);
    }
  }, [exercise.id]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

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
    return <span className="text-xs text-[#555]">→</span>;
  }

  // Recent sets (latest 10, reversed)
  const recentSets = [...sets].reverse().slice(0, 10);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#1F1F1F]">
        <Link
          href="/"
          className="text-[#888] hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← {t('exercise.backToHome')}
        </Link>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 space-y-5">
        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{exercise.icon}</span>
          <h1 className="text-xl font-bold text-white">{t(exercise.nameKey)}</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Muscle map — always visible */}
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
              <p className="text-sm font-semibold text-white mb-4">{t('exercise.muscles')}</p>
              <MuscleMap
                primary={exercise.muscles.primary}
                secondary={exercise.muscles.secondary}
              />
            </div>

            {sets.length === 0 ? (
              <div className="text-center py-10 text-[#555]">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm">{t('exercise.noData')}</p>
              </div>
            ) : (<>
            {/* PR + Volume row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Personal Record */}
              {pr && (
                <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-1">{t('exercise.pr')}</p>
                  <p className="text-2xl font-bold text-white">
                    {pr.weight}
                    <span className="text-sm font-normal text-[#FF5722] ml-1">{t('exercise.chartKg')}</span>
                  </p>
                  <p className="text-xs text-[#555] mt-1">
                    {new Date(pr.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Last session volume */}
              {volumeData.length > 0 && (
                <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-1">{t('exercise.lastVolume')}</p>
                  <p className="text-2xl font-bold text-white">
                    {volumeData[volumeData.length - 1].value.toLocaleString('ru-RU')}
                    <span className="text-sm font-normal text-[#FF8A65] ml-1">{t('exercise.chartKg')}</span>
                  </p>
                  <p className="text-xs text-[#555] mt-1">{t('exercise.volumeHint')}</p>
                </div>
              )}
            </div>

            {/* Volume chart */}
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{t('exercise.volumeChart')}</span>
                <TrendBadge trend={volumeTrend} />
              </div>
              <ProgressChart
                data={volumeData}
                label={`${t('exercise.volumeChart')}, ${t('exercise.chartKg')}`}
                unit={t('exercise.chartKg')}
                color="#FF5722"
              />
            </div>

            {/* History table */}
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1F1F1F]">
                <h2 className="text-sm font-semibold text-white">{t('exercise.history')}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[#555] border-b border-[#1F1F1F]">
                    <th className="text-left px-4 py-2 font-medium">{t('exercise.historyDate')}</th>
                    <th className="text-right px-4 py-2 font-medium">{t('exercise.historyWeight')}</th>
                    <th className="text-right px-4 py-2 font-medium">{t('exercise.historyReps')}</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {recentSets.map((s) => {
                    const date = new Date(s.created_at);
                    const label = date.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isConfirming = confirmDeleteId === s.id;
                    return (
                      <tr key={s.id} className={`border-b border-[#1A1A1A] last:border-0 transition-colors ${isConfirming ? 'bg-red-950/30' : 'hover:bg-[#1A1A1A]'}`}>
                        <td className="px-4 py-3 text-[#888] text-xs">{label}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white font-semibold">{s.weight}</span>
                          <span className="text-[#555] text-xs ml-1">{t('home.kg')}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-white font-semibold">{s.reps}</span>
                          <span className="text-[#555] text-xs ml-1">{t('home.lastReps')}</span>
                        </td>
                        <td className="px-3 py-2">
                          {isConfirming ? (
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => handleDelete(s.id)}
                                disabled={deleting}
                                className="text-xs text-red-400 font-semibold hover:text-red-300 disabled:opacity-50 px-1"
                              >
                                {deleting ? '…' : t('exercise.confirmDelete')}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-[#555] hover:text-white px-1"
                              >
                                {t('exercise.cancelDelete')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setEditingSet(s)}
                                className="w-7 h-7 flex items-center justify-center text-[#555] hover:text-white hover:bg-[#1F1F1F] rounded-lg transition-colors text-sm"
                                title={t('exercise.editSet')}
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(s.id)}
                                className="w-7 h-7 flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-sm"
                                title={t('exercise.deleteSet')}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}
          </>
        )}
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
          onSuccess={loadSets}
          userId={userId}
          defaultExerciseId={exercise.id}
        />
      )}

      {editingSet && (
        <AddSetModal
          onClose={() => setEditingSet(null)}
          onSuccess={loadSets}
          userId={userId}
          existingSet={editingSet}
        />
      )}
    </div>
  );
}
