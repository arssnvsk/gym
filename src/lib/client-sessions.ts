import { createClient } from '@/lib/supabase/client';
import {
  getAllSessionsByUser,
  upsertClientSession,
  replaceClientSessions,
  removeClientSession,
} from '@/lib/db';
import type { ClientSession } from '@/types';

// ── Supabase ──────────────────────────────────────────────────────────────────

async function fetchSessionsFromServer(userId: string): Promise<ClientSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClientSession[];
}

// ── Public API ────────────────────────────────────────────────────────────────

/** IndexedDB first — instant, offline-safe. */
export async function getSessionsCached(userId: string): Promise<ClientSession[]> {
  return getAllSessionsByUser(userId);
}

/** Fetch fresh data from Supabase and replace IndexedDB cache (removes deleted sessions). */
export async function refreshSessions(userId: string): Promise<ClientSession[]> {
  const fresh = await fetchSessionsFromServer(userId);
  await replaceClientSessions(userId, fresh);
  return fresh;
}

interface SessionInput {
  user_id: string;
  client_profile_id: string;
  scheduled_at: string;
  notes?: string | null;
}

export async function createSession(input: SessionInput): Promise<ClientSession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_sessions')
    .insert({
      user_id: input.user_id,
      client_profile_id: input.client_profile_id,
      scheduled_at: input.scheduled_at,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const session = data as ClientSession;
  await upsertClientSession(session);
  return session;
}

export async function updateSession(
  id: string,
  patch: Partial<Pick<ClientSession, 'client_profile_id' | 'scheduled_at' | 'notes'>>,
): Promise<ClientSession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('client_sessions')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  const session = data as ClientSession;
  await upsertClientSession(session);
  return session;
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('client_sessions').delete().eq('id', id);
  if (error) throw error;
  await removeClientSession(id);
}
