import type { WorkoutSet } from '@/types';

export interface NextSetRec {
  weight: number;
  reps: number;
  rir: number;
  type: 'increase' | 'maintain' | 'reduce';
}

// refSets — most recent session (newest-first), prevSets — session before that
export function computeNextSet(refSets: WorkoutSet[], prevSets: WorkoutSet[]): NextSetRec | null {
  if (refSets.length === 0) return null;

  const isBodyweight = refSets.every(s => s.weight === 0);
  const lastSet = refSets[0]; // most recent set in the reference session
  const weight = lastSet.weight;

  const refAtW = refSets.filter(s => s.weight === weight);
  const firstRepsAtWeight = refAtW[refAtW.length - 1].reps; // first set at this weight
  const lastRepsAtWeight = refAtW[0].reps;                   // last set at this weight
  const retention = firstRepsAtWeight > 0 ? lastRepsAtWeight / firstRepsAtWeight : 1;

  const refTotal = refAtW.reduce((sum, s) => sum + s.reps, 0);
  const avgRef = refTotal / refAtW.length;

  const prevAtW = prevSets.filter(s => s.weight === weight);
  const avgPrev = prevAtW.length > 0
    ? prevAtW.reduce((sum, s) => sum + s.reps, 0) / prevAtW.length
    : null;

  // Need ≥2 sets to detect a meaningful fatigue trend
  if (refSets.length >= 2 && retention < 0.8) {
    const newWeight = isBodyweight ? 0 : Math.max(0, Math.round((weight * 0.925) / 2.5) * 2.5);
    return { weight: newWeight, reps: lastRepsAtWeight, rir: 3, type: 'reduce' };
  }

  if (refSets.length >= 2 && retention >= 0.85 && avgPrev !== null && avgRef >= avgPrev * 0.95) {
    const newWeight = isBodyweight ? 0 : weight + 2.5;
    const newReps = isBodyweight ? firstRepsAtWeight + 1 : Math.max(1, firstRepsAtWeight - 1);
    return { weight: newWeight, reps: newReps, rir: 2, type: 'increase' };
  }

  return { weight, reps: firstRepsAtWeight, rir: 2, type: 'maintain' };
}
