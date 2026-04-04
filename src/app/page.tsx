import HomeClient from './HomeClient';
import { getServerPreferences } from '@/lib/preferences.server';
import { getStreakServer, getReadinessServer } from '@/lib/day.server';

export default async function HomePage() {
  const [preferences, streak, readiness] = await Promise.all([
    getServerPreferences(),
    getStreakServer(),
    getReadinessServer(),
  ]);
  return <HomeClient initialPreferences={preferences} initialStreak={streak} initialReadiness={readiness} />;
}
