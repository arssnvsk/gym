import { createClient } from '@/lib/supabase/server';
import { computeStreak, computeDayStats, type DayStats } from './day';
import { computeReadiness, type ReadinessInfo } from './insights';

async function fetchAllSets() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const { data } = await supabase.from('sets').select('*').order('created_at', { ascending: true });
  return data ?? null;
}

export async function getStreakServer(): Promise<number> {
  try {
    const data = await fetchAllSets();
    if (!data || data.length === 0) return 0;
    const dates = [...new Set(data.map((s: { created_at: string }) => s.created_at.slice(0, 10)))]
      .sort((a, b) => b.localeCompare(a));
    return computeStreak(dates as string[]);
  } catch {
    return 0;
  }
}

export async function getReadinessServer(): Promise<ReadinessInfo | null> {
  try {
    const data = await fetchAllSets();
    if (!data || data.length === 0) return null;
    return computeReadiness(data);
  } catch {
    return null;
  }
}

export async function getDayStatsServer(date: string): Promise<DayStats | null> {
  try {
    const data = await fetchAllSets();
    if (!data || data.length === 0) return null;
    return computeDayStats(data, date);
  } catch {
    return null;
  }
}
