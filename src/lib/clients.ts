import { createClient } from '@/lib/supabase/client';
import {
  getAllClientProfiles,
  replaceClientProfiles,
  upsertClientProfile,
  getClientProfileById,
  removeClientProfileFromDB,
  removeClientSessionsByClientId,
  removeSetsByClientId,
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

/** Stale-while-revalidate: returns IndexedDB immediately, refreshes in background.
 *  onFresh is called when server data arrives (only when stale was returned first). */
export async function getClientsCached(
  userId: string,
  onFresh?: (fresh: ClientProfile[]) => void,
): Promise<ClientProfile[]> {
  const cached = await getAllClientProfiles(userId);

  if (cached.length > 0) {
    fetchClientsFromServer(userId)
      .then((fresh) => {
        replaceClientProfiles(userId, fresh).catch(() => {});
        onFresh?.(fresh);
      })
      .catch(() => {});
    return cached;
  }

  const fresh = await fetchClientsFromServer(userId);
  replaceClientProfiles(userId, fresh).catch(() => {});
  return fresh;
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

export async function deleteClientProfile(id: string, userId: string): Promise<void> {
  const supabase = createClient();
  // Cascade: sets → sessions → profile
  const { error: setsError } = await supabase.from('sets').delete().eq('client_profile_id', id);
  if (setsError) throw setsError;
  const { error: sessionsError } = await supabase.from('client_sessions').delete().eq('client_profile_id', id);
  if (sessionsError) throw sessionsError;
  const { error } = await supabase.from('client_profiles').delete().eq('id', id);
  if (error) throw error;
  // Clean up IndexedDB
  await removeSetsByClientId(userId, id);
  await removeClientSessionsByClientId(userId, id);
  await removeClientProfileFromDB(id);
}

export async function setClientStatus(id: string, userId: string, is_active: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('client_profiles')
    .update({ is_active })
    .eq('id', id);
  if (error) throw error;
  // When pausing — delete all future sessions
  if (!is_active) {
    const { error: sessionsError } = await supabase
      .from('client_sessions')
      .delete()
      .eq('client_profile_id', id);
    if (sessionsError) throw sessionsError;
    await removeClientSessionsByClientId(userId, id);
  }
  // Update local cache
  const existing = await getClientProfileById(id);
  if (existing) await upsertClientProfile({ ...existing, is_active });
}
