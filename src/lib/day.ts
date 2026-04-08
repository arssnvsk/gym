import { createClient } from '@/lib/supabase/client';
import * as localDb from '@/lib/db';
import { getExercises } from '@/lib/exercises';
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
export function computeDayStats(allSets: WorkoutSet[], date: string, exercises: Exercise[]): DayStats | null {
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
    const exercise = exercises.find(e => e.id === exerciseId);
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

/** Returns the current training streak: number of consecutive training sessions
 *  where the gap between any two adjacent sessions is ≤ 3 calendar days (i.e. max 2 rest days).
 *  The streak is also considered alive if the last training was ≤ 2 days ago. */
export function computeStreak(sortedDatesNewestFirst: string[]): number {
  if (sortedDatesNewestFirst.length === 0) return 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const latest = sortedDatesNewestFirst[0];

  const daysSinceLast = Math.round(
    (new Date(todayStr + 'T12:00:00').getTime() - new Date(latest + 'T12:00:00').getTime())
    / 86_400_000,
  );

  // If last training was 3+ days ago — streak is broken
  if (daysSinceLast > 2) return 0;

  // Count consecutive sessions, allowing up to 2 rest days between each pair
  let streak = 1;
  for (let i = 0; i < sortedDatesNewestFirst.length - 1; i++) {
    const gap = Math.round(
      (new Date(sortedDatesNewestFirst[i] + 'T12:00:00').getTime() -
        new Date(sortedDatesNewestFirst[i + 1] + 'T12:00:00').getTime())
      / 86_400_000,
    );
    if (gap <= 3) streak++;
    else break;
  }
  return streak;
}

function filterByClient(sets: WorkoutSet[], clientProfileId?: string | null): WorkoutSet[] {
  if (clientProfileId) return sets.filter(s => s.client_profile_id === clientProfileId);
  return sets.filter(s => !s.client_profile_id);
}

export async function getStreakCached(clientProfileId?: string | null): Promise<number> {
  const dates = await getWorkoutDatesCached(clientProfileId);
  return computeStreak(dates);
}

/** Returns unique workout dates sorted newest-first, from IndexedDB only. */
export async function getWorkoutDatesCached(clientProfileId?: string | null): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return [];

    const allSets = await localDb.getAllSetsByUser(session.user.id);
    const filtered = filterByClient(allSets, clientProfileId);
    const dates = new Set(filtered.map(s => s.created_at.slice(0, 10)));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

/** IndexedDB only — no network, instant. Use for stale-while-revalidate. */
export async function getDayStatsCached(date: string, clientProfileId?: string | null): Promise<DayStats | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const [allSets, exercises] = await Promise.all([
      localDb.getAllSetsByUser(session.user.id),
      getExercises(),
    ]);
    const filtered = filterByClient(allSets, clientProfileId);
    return computeDayStats(filtered, date, exercises);
  } catch {
    return null;
  }
}

/** Fetches from Supabase and updates IndexedDB cache. Falls back to IndexedDB. */
export async function getDayStats(date: string, clientProfileId?: string | null): Promise<DayStats | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const exercises = await getExercises();

  try {
    let query = supabase.from('sets').select('*').order('created_at', { ascending: true });
    if (clientProfileId) {
      query = query.eq('client_profile_id', clientProfileId);
    } else {
      query = query.is('client_profile_id', null);
    }
    const { data, error } = await query;

    if (!error && data) {
      await localDb.upsertSets(data);
      return computeDayStats(data, date, exercises);
    }
  } catch {
    // fall through to local cache
  }

  try {
    const allSets = await localDb.getAllSetsByUser(session.user.id);
    const filtered = filterByClient(allSets, clientProfileId);
    return computeDayStats(filtered, date, exercises);
  } catch {
    return null;
  }
}
