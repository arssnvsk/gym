import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PREFERENCES, type UserPreferences } from './preferences';

export async function getServerPreferences(): Promise<UserPreferences> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return DEFAULT_PREFERENCES;

    const { data } = await supabase
      .from('user_preferences')
      .select('settings')
      .eq('user_id', session.user.id)
      .single();

    if (!data?.settings) return DEFAULT_PREFERENCES;
    const s = data.settings as Record<string, unknown>;
    return {
      exerciseLayout: s.exerciseLayout === 'grid' ? 'grid' : 'list',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
