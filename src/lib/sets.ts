import { createClient } from '@/lib/supabase/client';
import type { SetInput, WorkoutSet, ChartPoint } from '@/types';

export async function deleteSet(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('sets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSet(id: string, data: Pick<SetInput, 'weight' | 'reps'>): Promise<WorkoutSet> {
  const supabase = createClient();
  const { data: updated, error } = await supabase
    .from('sets')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function addSet(input: SetInput, userId: string): Promise<WorkoutSet> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sets')
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSetsByExercise(exerciseId: string): Promise<WorkoutSet[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getLastSetPerExercise(): Promise<Record<string, WorkoutSet>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const result: Record<string, WorkoutSet> = {};
  for (const set of data ?? []) {
    if (!result[set.exercise_id]) {
      result[set.exercise_id] = set;
    }
  }
  return result;
}

/** Daily total volume: Σ(weight × reps) per day */
export function toVolumeChartData(sets: WorkoutSet[]): ChartPoint[] {
  const byDate = new Map<string, number>();

  for (const s of sets) {
    const date = s.created_at.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + s.weight * s.reps);
  }

  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

/** Personal record: max weight ever, with the date it was achieved */
export function getPersonalRecord(sets: WorkoutSet[]): { weight: number; date: string } | null {
  if (sets.length === 0) return null;
  let pr = sets[0];
  for (const s of sets) {
    if (s.weight > pr.weight) pr = s;
  }
  return { weight: pr.weight, date: pr.created_at };
}
