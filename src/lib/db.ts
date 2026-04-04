import type { WorkoutSet } from '@/types';

const DB_NAME = 'gymdb';
const DB_VERSION = 1;

export interface SyncQueueItem {
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
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sets')) {
        const store = db.createObjectStore('sets', { keyPath: 'id' });
        store.createIndex('by_exercise', ['user_id', 'exercise_id']);
        store.createIndex('by_user', 'user_id');
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'key', autoIncrement: true });
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
