import SettingsClient from './SettingsClient';
import { getServerPreferences } from '@/lib/preferences.server';

export default async function SettingsPage() {
  const preferences = await getServerPreferences();
  return <SettingsClient initialPreferences={preferences} />;
}
