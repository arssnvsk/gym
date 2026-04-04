import HomeClient from './HomeClient';
import { getServerPreferences } from '@/lib/preferences.server';

export default async function HomePage() {
  const preferences = await getServerPreferences();
  return <HomeClient initialPreferences={preferences} />;
}
