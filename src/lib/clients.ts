import { createClient } from '@/lib/supabase/client';
import {
  getAllClientProfiles,
  replaceClientProfiles,
  upsertClientProfile,
} from '@/lib/db';
import type { ClientProfile } from '@/types';

// ── Supabase ──────────────────────────────────────────────────────────────────

async function fetchClientsFromServer(userId: string): Promise<ClientProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClientProfile[];
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Stale-while-revalidate: returns IndexedDB immediately, refreshes in background */
export async function getClientsCached(userId: string): Promise<ClientProfile[]> {
  const cached = await getAllClientProfiles(userId);

  // Refresh in background — replace-sync removes deleted clients from IndexedDB
  fetchClientsFromServer(userId)
    .then((fresh) => replaceClientProfiles(userId, fresh))
    .catch(() => {});

  return cached.length > 0 ? cached : fetchClientsFromServer(userId).then((fresh) => {
    replaceClientProfiles(userId, fresh).catch(() => {});
    return fresh;
  });
}

/** Force-fetch from Supabase and replace IndexedDB. Use when fresh data is critical (e.g. before saving sessions). */
export async function refreshClients(userId: string): Promise<ClientProfile[]> {
  const fresh = await fetchClientsFromServer(userId);
  await replaceClientProfiles(userId, fresh);
  return fresh;
}

export async function createClientProfile(userId: string, name: string): Promise<ClientProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_profiles')
    .insert({ user_id: userId, name: name.trim(), is_active: true })
    .select()
    .single();
  if (error) throw error;
  const profile = data as ClientProfile;
  await upsertClientProfile(profile);
  return profile;
}

export async function setClientStatus(id: string, is_active: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('client_profiles')
    .update({ is_active })
    .eq('id', id);
  if (error) throw error;
  // Update local cache
  const { getClientProfileById } = await import('@/lib/db');
  const existing = await getClientProfileById(id);
  if (existing) await upsertClientProfile({ ...existing, is_active });
}
