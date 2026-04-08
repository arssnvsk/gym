import HomeClient from './HomeClient';
import { getServerPreferences } from '@/lib/preferences.server';
import { getStreakServer, getReadinessServer, getDayStatsServer } from '@/lib/day.server';
import { getExercisesServer } from '@/lib/exercises.server';

function getTodayDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export default async function HomePage() {
  const today = getTodayDate();
  const [preferences, streak, readiness, todayStats, exercises] = await Promise.all([
    getServerPreferences(),
    getStreakServer(),
    getReadinessServer(),
    getDayStatsServer(today),
    getExercisesServer(),
  ]);
  return (
    <HomeClient
      initialPreferences={preferences}
      initialStreak={streak}
      initialReadiness={readiness}
      initialTodayStats={todayStats}
      initialExercises={exercises}
    />
  );
}
