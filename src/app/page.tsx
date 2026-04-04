import HomeClient from './HomeClient';
import { getServerPreferences } from '@/lib/preferences.server';
import { getStreakServer } from '@/lib/day.server';

export default async function HomePage() {
  const [preferences, streak] = await Promise.all([
    getServerPreferences(),
    getStreakServer(),
  ]);
  return <HomeClient initialPreferences={preferences} initialStreak={streak} />;
}
