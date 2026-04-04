import { createClient } from '@/lib/supabase/client';
import { getQueue, removeFromQueue, upsertSet } from '@/lib/db';
import type { WorkoutSet } from '@/types';

// Promise-based lock: if a sync is already running, piggyback on it
let syncPromise: Promise<{ synced: number }> | null = null;

export function syncPendingOperations(): Promise<{ synced: number }> {
  if (syncPromise) return syncPromise;
  if (!navigator.onLine) return Promise.resolve({ synced: 0 });

  syncPromise = doSync().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
}

async function doSync(): Promise<{ synced: number }> {
  let synced = 0;

  try {
    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0 };

    const supabase = createClient();

    for (const item of queue) {
      try {
        if (item.type === 'insert') {
          const set = item.payload as WorkoutSet;
          const { data, error } = await supabase
            .from('sets')
            .insert({ ...set })
            .select()
            .single();

          if (error) {
            // 23505 = duplicate key: set already synced (e.g. double-submit)
            if (error.code === '23505') {
              await removeFromQueue(item.key!);
              synced++;
            }
            // Any other error: leave in queue, retry next online event
            continue;
          }
          await upsertSet(data);
          await removeFromQueue(item.key!);
          synced++;

        } else if (item.type === 'update') {
          const { id, data } = item.payload as { id: string; data: { weight: number; reps: number } };
          const { error } = await supabase.from('sets').update(data).eq('id', id);
          if (error) continue;
          await removeFromQueue(item.key!);
          synced++;

        } else if (item.type === 'delete') {
          const { id } = item.payload as { id: string };
          const { error } = await supabase.from('sets').delete().eq('id', id);
          // Row already gone (404/PGRST116) — treat as success
          if (error && error.code !== 'PGRST116') continue;
          await removeFromQueue(item.key!);
          synced++;
        }
      } catch {
        // Network hiccup on this item — leave in queue, retry next cycle
      }
    }
  } catch {
    // getQueue() failed (e.g. IndexedDB unavailable) — nothing to sync
  }

  return { synced };
}
