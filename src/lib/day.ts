import { createClient } from '@/lib/supabase/client';
import * as localDb from '@/lib/db';
import { EXERCISES } from '@/lib/exercises';
import type { WorkoutSet, Exercise, MuscleGroup } from '@/types';

export type ExerciseTrend = 'progress' | 'regression' | 'neutral' | 'new';
export type DayTrend = 'progress' | 'regression' | 'neutral' | 'first';

export interface ExerciseDayStat {
  exercise: Exercise;
  todaySets: number;
  todayVolume: number;
  isBodyweight: boolean;
  prevDate: string | null;
  prevVolume: number | null;
  trend: ExerciseTrend;
  changePercent: number | null;
}

export interface DayStats {
  date: string;
  exerciseStats: ExerciseDayStat[];
  dayTrend: DayTrend;
  progressCount: number;
  regressionCount: number;
  newCount: number;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}

function calcVolume(sets: WorkoutSet[]): { volume: number; isBodyweight: boolean } {
  const isBodyweight = sets.every(s => s.weight === 0);
  const volume = sets.reduce((acc, s) => acc + (isBodyweight ? s.reps : s.weight * s.reps), 0);
  return { volume, isBodyweight };
}

function calcTrend(todayVol: number, prevVol: number): ExerciseTrend {
  if (prevVol === 0) return 'neutral';
  const diff = (todayVol - prevVol) / prevVol;
  if (diff > 0.02) return 'progress';
  if (diff < -0.02) return 'regression';
  return 'neutral';
}

/** Pure computation — no I/O, works on any array of sets */
function computeDayStats(allSets: WorkoutSet[], date: string): DayStats | null {
  const todaySets = allSets.filter(s => s.created_at.slice(0, 10) === date);
  if (todaySets.length === 0) return null;

  const prevAllSets = allSets.filter(s => s.created_at.slice(0, 10) < date);

  const byExercise = new Map<string, WorkoutSet[]>();
  for (const s of todaySets) {
    if (!byExercise.has(s.exercise_id)) byExercise.set(s.exercise_id, []);
    byExercise.get(s.exercise_id)!.push(s);
  }

  const exerciseStats: ExerciseDayStat[] = [];
  const allPrimaryMuscles = new Set<MuscleGroup>();
  const allSecondaryMuscles = new Set<MuscleGroup>();

  for (const [exerciseId, sets] of byExercise) {
    const exercise = EXERCISES.find(e => e.id === exerciseId);
    if (!exercise) continue;

    exercise.muscles.primary.forEach(m => allPrimaryMuscles.add(m));
    exercise.muscles.secondary.forEach(m => allSecondaryMuscles.add(m));

    const { volume: todayVolume, isBodyweight } = calcVolume(sets);
    const prevExSets = prevAllSets.filter(s => s.exercise_id === exerciseId);

    let prevDate: string | null = null;
    let prevVolume: number | null = null;
    let trend: ExerciseTrend = 'new';
    let changePercent: number | null = null;

    if (prevExSets.length > 0) {
      prevDate = prevExSets.reduce((latest, s) => {
        const d = s.created_at.slice(0, 10);
        return d > latest ? d : latest;
      }, '');

      const prevDaySets = prevExSets.filter(s => s.created_at.slice(0, 10) === prevDate);
      const { volume } = calcVolume(prevDaySets);
      prevVolume = volume;
      trend = calcTrend(todayVolume, prevVolume);
      if (prevVolume > 0) {
        changePercent = Math.round(((todayVolume - prevVolume) / prevVolume) * 100);
      }
    }

    exerciseStats.push({
      exercise,
      todaySets: sets.length,
      todayVolume,
      isBodyweight,
      prevDate,
      prevVolume,
      trend,
      changePercent,
    });
  }

  const withHistory = exerciseStats.filter(s => s.trend !== 'new');
  const progressCount = exerciseStats.filter(s => s.trend === 'progress').length;
  const regressionCount = exerciseStats.filter(s => s.trend === 'regression').length;
  const newCount = exerciseStats.filter(s => s.trend === 'new').length;

  let dayTrend: DayTrend = 'neutral';
  if (withHistory.length === 0) {
    dayTrend = 'first';
  } else if (progressCount / withHistory.length > 0.5) {
    dayTrend = 'progress';
  } else if (regressionCount / withHistory.length > 0.5) {
    dayTrend = 'regression';
  }

  const primaryMuscles = Array.from(allPrimaryMuscles);
  const secondaryMuscles = Array.from(allSecondaryMuscles).filter(m => !allPrimaryMuscles.has(m));

  return {
    date,
    exerciseStats,
    dayTrend,
    progressCount,
    regressionCount,
    newCount,
    primaryMuscles,
    secondaryMuscles,
  };
}

/** Returns unique workout dates sorted newest-first, from IndexedDB only. */
export async function getWorkoutDatesCached(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return [];

    const allSets = await localDb.getAllSetsByUser(session.user.id);
    const dates = new Set(allSets.map(s => s.created_at.slice(0, 10)));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

/** IndexedDB only — no network, instant. Use for stale-while-revalidate. */
export async function getDayStatsCached(date: string): Promise<DayStats | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const allSets = await localDb.getAllSetsByUser(session.user.id);
    return computeDayStats(allSets, date);
  } catch {
    return null;
  }
}

/** Fetches from Supabase and updates IndexedDB cache. Falls back to IndexedDB. */
export async function getDayStats(date: string): Promise<DayStats | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  try {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      await localDb.upsertSets(data);
      return computeDayStats(data, date);
    }
  } catch {
    // fall through to local cache
  }

  try {
    const allSets = await localDb.getAllSetsByUser(session.user.id);
    return computeDayStats(allSets, date);
  } catch {
    return null;
  }
}
