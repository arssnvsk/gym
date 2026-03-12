import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  { id: 'bench_press', nameKey: 'exercises.bench_press', icon: '🏋️', category: 'chest' },
  { id: 'incline_press', nameKey: 'exercises.incline_press', icon: '📐', category: 'chest' },
  { id: 'squat', nameKey: 'exercises.squat', icon: '🦵', category: 'legs' },
  { id: 'leg_press', nameKey: 'exercises.leg_press', icon: '🦿', category: 'legs' },
  { id: 'deadlift', nameKey: 'exercises.deadlift', icon: '⚡', category: 'back' },
  { id: 'barbell_row', nameKey: 'exercises.barbell_row', icon: '🔄', category: 'back' },
  { id: 'lat_pulldown', nameKey: 'exercises.lat_pulldown', icon: '⬇️', category: 'back' },
  { id: 'overhead_press', nameKey: 'exercises.overhead_press', icon: '🙌', category: 'shoulders' },
  { id: 'pull_up', nameKey: 'exercises.pull_up', icon: '🆙', category: 'back' },
  { id: 'dip', nameKey: 'exercises.dip', icon: '🔽', category: 'chest' },
  { id: 'bicep_curl', nameKey: 'exercises.bicep_curl', icon: '💪', category: 'arms' },
  { id: 'tricep_pushdown', nameKey: 'exercises.tricep_pushdown', icon: '📏', category: 'arms' },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export const CATEGORY_ORDER: Exercise['category'][] = [
  'chest',
  'legs',
  'back',
  'shoulders',
  'arms',
];
