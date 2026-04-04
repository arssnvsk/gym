import { createClient } from '@/lib/supabase/client';
import * as localDb from '@/lib/db';

export type ExerciseLayout = 'list' | 'grid';

export interface UserPreferences {
  exerciseLayout: ExerciseLayout;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  exerciseLayout: 'list',
};

function parse(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFERENCES;
  const r = raw as Record<string, unknown>;
  return {
    exerciseLayout: r.exerciseLayout === 'grid' ? 'grid' : 'list',
  };
}

/** IndexedDB only — instant, offline-safe */
export async function getPreferencesCached(): Promise<UserPreferences> {
  try {
    const raw = await localDb.getPreferencesLocal();
    return parse(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Save to Supabase + IndexedDB simultaneously */
export async function updatePreferences(patch: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferencesCached();
  const updated = { ...current, ...patch };

  // Local first — instant, works offline
  await localDb.savePreferencesLocal(updated);

  // Supabase in background
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { error } = await supabase.from('user_preferences').upsert(
      { user_id: session.user.id, settings: updated, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) console.error('[preferences] upsert failed:', error.message);
  } catch (e) {
    console.error('[preferences] upsert error:', e);
  }
}
