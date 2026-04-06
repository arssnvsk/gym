import { createClient } from '@/lib/supabase/client';
import type { SetInput, WorkoutSet, ChartPoint } from '@/types';
import * as localDb from '@/lib/db';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Get current user id from cached session (works offline). */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function deleteSet(id: string): Promise<void> {
  // Optimistic local delete immediately
  await localDb.removeSet(id);

  if (!navigator.onLine) {
    await localDb.pushToQueue({ type: 'delete', payload: { id }, createdAt: Date.now() });
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from('sets').delete().eq('id', id);
  if (error) {
    await localDb.pushToQueue({ type: 'delete', payload: { id }, createdAt: Date.now() });
  }
}

export async function updateSet(id: string, data: Pick<SetInput, 'weight' | 'reps'>): Promise<WorkoutSet> {
  // Apply optimistic update locally
  const existing = await localDb.getSetById(id);
  const optimistic = existing ? { ...existing, ...data } : null;
  if (optimistic) await localDb.upsertSet(optimistic);

  if (!navigator.onLine) {
    await localDb.pushToQueue({ type: 'update', payload: { id, data }, createdAt: Date.now() });
    if (optimistic) return optimistic;
    throw new Error('Offline');
  }

  const supabase = createClient();
  const { data: updated, error } = await supabase
    .from('sets')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    await localDb.pushToQueue({ type: 'update', payload: { id, data }, createdAt: Date.now() });
    if (optimistic) return optimistic;
    throw error;
  }

  await localDb.upsertSet(updated);
  return updated;
}

export async function addSet(input: SetInput, userId: string, clientProfileId?: string | null): Promise<WorkoutSet> {
  // Generate UUID client-side so it stays consistent between local and server
  const id = generateId();
  const localSet: WorkoutSet = {
    id,
    user_id: userId,
    exercise_id: input.exercise_id,
    reps: input.reps,
    weight: input.weight,
    created_at: new Date().toISOString(),
    client_profile_id: clientProfileId ?? null,
  };

  await localDb.upsertSet(localSet);

  if (!navigator.onLine) {
    await localDb.pushToQueue({ type: 'insert', payload: localSet, createdAt: Date.now() });
    return localSet;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sets')
    .insert({ ...localSet })
    .select()
    .single();

  if (error) {
    await localDb.pushToQueue({ type: 'insert', payload: localSet, createdAt: Date.now() });
    return localSet;
  }

  await localDb.upsertSet(data);
  return data;
}

function filterByClient(sets: WorkoutSet[], clientProfileId?: string | null): WorkoutSet[] {
  if (clientProfileId) return sets.filter(s => s.client_profile_id === clientProfileId);
  return sets.filter(s => !s.client_profile_id);
}

/** IndexedDB only — no network, instant. Use for stale-while-revalidate. */
export async function getSetsByExerciseCached(exerciseId: string, clientProfileId?: string | null): Promise<WorkoutSet[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const cached = await localDb.getSetsByExercise(userId, exerciseId);
  return filterByClient(cached, clientProfileId).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** IndexedDB only — no network, instant. Use for stale-while-revalidate. */
export async function getLastSetPerExerciseCached(clientProfileId?: string | null): Promise<Record<string, WorkoutSet>> {
  const userId = await getCurrentUserId();
  if (!userId) return {};
  const allSets = await localDb.getAllSetsByUser(userId);
  const filtered = filterByClient(allSets, clientProfileId);
  filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const result: Record<string, WorkoutSet> = {};
  for (const set of filtered) {
    if (!result[set.exercise_id]) result[set.exercise_id] = set;
  }
  return result;
}

export async function getSetsByExercise(exerciseId: string, clientProfileId?: string | null): Promise<WorkoutSet[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('sets')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: true });

    if (clientProfileId) {
      query = query.eq('client_profile_id', clientProfileId);
    } else {
      query = query.is('client_profile_id', null);
    }

    const { data, error } = await query;
    if (!error && data) {
      await localDb.upsertSets(data);
      return data;
    }
  } catch {
    // fall through to local cache
  }

  const userId = await getCurrentUserId();
  if (!userId) return [];
  const cached = await localDb.getSetsByExercise(userId, exerciseId);
  return filterByClient(cached, clientProfileId).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getLastSetPerExercise(clientProfileId?: string | null): Promise<Record<string, WorkoutSet>> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('sets')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientProfileId) {
      query = query.eq('client_profile_id', clientProfileId);
    } else {
      query = query.is('client_profile_id', null);
    }

    const { data, error } = await query;
    if (!error && data) {
      await localDb.upsertSets(data);
      const result: Record<string, WorkoutSet> = {};
      for (const set of data) {
        if (!result[set.exercise_id]) result[set.exercise_id] = set;
      }
      return result;
    }
  } catch {
    // fall through to local cache
  }

  const userId = await getCurrentUserId();
  if (!userId) return {};
  const allSets = await localDb.getAllSetsByUser(userId);
  const filtered = filterByClient(allSets, clientProfileId);
  filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const result: Record<string, WorkoutSet> = {};
  for (const set of filtered) {
    if (!result[set.exercise_id]) result[set.exercise_id] = set;
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
