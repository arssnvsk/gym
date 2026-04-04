import { createClient } from '@/lib/supabase/server';
import { computeStreak } from './day';

export async function getStreakServer(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return 0;

    const { data } = await supabase
      .from('sets')
      .select('created_at')
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return 0;

    const dates = [...new Set(data.map((s: { created_at: string }) => s.created_at.slice(0, 10)))]
      .sort((a, b) => b.localeCompare(a));

    return computeStreak(dates);
  } catch {
    return 0;
  }
}
