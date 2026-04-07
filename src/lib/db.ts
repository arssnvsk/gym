import type { WorkoutSet, ClientProfile, ClientSession } from '@/types';

const DB_NAME = 'gymdb';
const DB_VERSION = 4;

interface SyncQueueItem {
  key?: number;
  type: 'insert' | 'update' | 'delete';
  payload: unknown;
  createdAt: number;
}

function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  if (!isAvailable()) return Promise.reject(new Error('IndexedDB not available'));

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onblocked = () => {
      // Another tab is holding v1 open — ask it to close
      console.warn('[db] upgrade blocked by another tab');
    };
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const oldVersion = e.oldVersion;

      if (oldVersion < 1) {
        const store = db.createObjectStore('sets', { keyPath: 'id' });
        store.createIndex('by_exercise', ['user_id', 'exercise_id']);
        store.createIndex('by_user', 'user_id');
        db.createObjectStore('sync_queue', { keyPath: 'key', autoIncrement: true });
      }
      if (oldVersion < 2) {
        db.createObjectStore('preferences');
      }
      if (oldVersion < 3) {
        const cp = db.createObjectStore('client_profiles', { keyPath: 'id' });
        cp.createIndex('by_user', 'user_id');
      }
      if (oldVersion < 4) {
        const cs = db.createObjectStore('client_sessions', { keyPath: 'id' });
        cs.createIndex('by_user', 'user_id');
        cs.createIndex('by_scheduled', 'scheduled_at');
      }
    };
  });
}

export async function getSetById(id: string): Promise<WorkoutSet | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('sets', 'readonly').objectStore('sets').get(id);
    req.onsuccess = () => resolve(req.result as WorkoutSet | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllSetsByUser(userId: string): Promise<WorkoutSet[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction('sets', 'readonly')
      .objectStore('sets')
      .index('by_user')
      .getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result as WorkoutSet[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getSetsByExercise(userId: string, exerciseId: string): Promise<WorkoutSet[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction('sets', 'readonly')
      .objectStore('sets')
      .index('by_exercise')
      .getAll(IDBKeyRange.only([userId, exerciseId]));
    req.onsuccess = () => resolve(req.result as WorkoutSet[]);
    req.onerror = () => reject(req.error);
  });
}

export async function upsertSets(sets: WorkoutSet[]): Promise<void> {
  if (!isAvailable() || sets.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sets', 'readwrite');
    const store = tx.objectStore('sets');
    sets.forEach((s) => store.put(s));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

export async function upsertSet(set: WorkoutSet): Promise<void> {
  return upsertSets([set]);
}

export async function removeSet(id: string): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sets', 'readwrite');
    tx.objectStore('sets').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

export async function getPreferencesLocal(): Promise<unknown> {
  if (!isAvailable()) return null;
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('preferences', 'readonly');
      const req = tx.objectStore('preferences').get('prefs');
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function savePreferencesLocal(value: unknown): Promise<void> {
  if (!isAvailable()) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('preferences', 'readwrite');
      tx.objectStore('preferences').put(value, 'prefs');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // preferences store not yet available — will work after page reload
  }
}

export async function pushToQueue(item: Omit<SyncQueueItem, 'key'>): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

export async function getQueue(): Promise<SyncQueueItem[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('sync_queue', 'readonly').objectStore('sync_queue').getAll();
    req.onsuccess = () => resolve(req.result as SyncQueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeFromQueue(key: number): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

export async function getAllClientProfiles(userId: string): Promise<ClientProfile[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction('client_profiles', 'readonly')
      .objectStore('client_profiles')
      .index('by_user')
      .getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result as ClientProfile[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getClientProfileById(id: string): Promise<ClientProfile | undefined> {
  if (!isAvailable()) return undefined;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('client_profiles', 'readonly').objectStore('client_profiles').get(id);
    req.onsuccess = () => resolve(req.result as ClientProfile | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function upsertClientProfile(profile: ClientProfile): Promise<void> {
  return upsertClientProfiles([profile]);
}

async function upsertClientProfiles(profiles: ClientProfile[]): Promise<void> {
  if (!isAvailable() || profiles.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('client_profiles', 'readwrite');
    const store = tx.objectStore('client_profiles');
    profiles.forEach((p) => store.put(p));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

/** Replace all profiles for a user — removes stale (deleted) records then upserts fresh. */
export async function replaceClientProfiles(userId: string, profiles: ClientProfile[]): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('client_profiles', 'readwrite');
    const store = tx.objectStore('client_profiles');
    const fresh = new Set(profiles.map((p) => p.id));
    const req = store.index('by_user').openCursor(IDBKeyRange.only(userId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (!fresh.has((cursor.value as ClientProfile).id)) cursor.delete();
        cursor.continue();
      } else {
        profiles.forEach((p) => store.put(p));
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

// ── client_sessions ───────────────────────────────────────────────────────────

export async function getAllSessionsByUser(userId: string): Promise<ClientSession[]> {
  if (!isAvailable()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction('client_sessions', 'readonly')
      .objectStore('client_sessions')
      .index('by_user')
      .getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result as ClientSession[]);
    req.onerror = () => reject(req.error);
  });
}

async function upsertClientSessions(sessions: ClientSession[]): Promise<void> {
  if (!isAvailable() || sessions.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('client_sessions', 'readwrite');
    const store = tx.objectStore('client_sessions');
    sessions.forEach((s) => store.put(s));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

/** Replace all sessions for a user — removes stale (deleted) records then upserts fresh. */
export async function replaceClientSessions(userId: string, sessions: ClientSession[]): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('client_sessions', 'readwrite');
    const store = tx.objectStore('client_sessions');
    const fresh = new Set(sessions.map((s) => s.id));
    const req = store.index('by_user').openCursor(IDBKeyRange.only(userId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (!fresh.has((cursor.value as ClientSession).id)) cursor.delete();
        cursor.continue();
      } else {
        sessions.forEach((s) => store.put(s));
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

export async function upsertClientSession(session: ClientSession): Promise<void> {
  return upsertClientSessions([session]);
}

export async function removeClientSession(id: string): Promise<void> {
  if (!isAvailable()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('client_sessions', 'readwrite');
    tx.objectStore('client_sessions').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
