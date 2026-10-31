import { Driver } from '../types';

export const SLOTS_CACHE_KEY = 'apex_gp_career_slots_v2';
export const LEGACY_SLOTS_KEYS = ['apex_gp_career_slots_v1', 'apex_gp_career_slots'];
export const RACE_MODE_CACHE_KEY = 'apex_gp_race_mode_v1';
export const DELETED_SLOT_CACHE_KEY = 'apex_gp_last_deleted_slot_v1';

const CACHE_STORAGE_NAME = 'apex-gp-driver-browser-cache-v2';
const CACHE_STORAGE_URL = '/__local_cache__/driver-slots.json';
const IDB_NAME = 'ApexGPBrowserCacheDB';
const IDB_STORE = 'driver_cache_store';

export interface BrowserCacheSnapshot {
  slots: (Driver | null)[];
  updatedAt: number;
}

/**
 * Requests durable storage permission from the browser so cached drivers
 * are not evicted by mobile or desktop browser cleanup routines.
 */
export async function requestPersistentBrowserCache(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // Ignore errors in restricted iframe contexts
  }
  return false;
}

function normalizeSlots(parsed: unknown): (Driver | null)[] | null {
  if (!Array.isArray(parsed)) return null;
  const normalized: (Driver | null)[] = [null, null, null, null];
  for (let i = 0; i < 4; i++) {
    const item = parsed[i];
    if (item && typeof item === 'object' && typeof (item as Driver).name === 'string') {
      normalized[i] = { ...(item as Driver), id: i };
    } else {
      normalized[i] = null;
    }
  }
  return normalized;
}

function hasAnyDriver(slots: (Driver | null)[] | null): boolean {
  return Array.isArray(slots) && slots.some(slot => slot !== null);
}

/**
 * Synchronously reads driver slots from localStorage (including legacy keys if present).
 */
export function loadSlotsFromLocalCache(): (Driver | null)[] {
  try {
    const raw = localStorage.getItem(SLOTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const slots = normalizeSlots(parsed);
      if (slots) return slots;
    }

    for (const legacyKey of LEGACY_SLOTS_KEYS) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        const slots = normalizeSlots(parsed);
        if (slots) {
          localStorage.setItem(SLOTS_CACHE_KEY, JSON.stringify(slots));
          return slots;
        }
      }
    }
  } catch (err) {
    console.error('Erro ao carregar pilotos do cache local:', err);
  }
  return [null, null, null, null];
}

/**
 * Saves driver slots to IndexedDB mirror for extra browser durability.
 */
function saveSlotsToIndexedDB(snapshot: BrowserCacheSnapshot): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve();
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(snapshot, SLOTS_CACHE_KEY);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        } catch {
          resolve();
        }
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Loads driver slots from IndexedDB mirror if localStorage was cleared.
 */
function loadSlotsFromIndexedDB(): Promise<BrowserCacheSnapshot | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(SLOTS_CACHE_KEY);
          getReq.onsuccess = () => {
            const res = getReq.result as BrowserCacheSnapshot | undefined;
            db.close();
            if (res && Array.isArray(res.slots)) {
              const normalized = normalizeSlots(res.slots);
              if (normalized) {
                resolve({ slots: normalized, updatedAt: res.updatedAt || 0 });
                return;
              }
            }
            resolve(null);
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Saves driver slots to the browser's CacheStorage API (`window.caches`) as an additional cache layer.
 */
async function saveSlotsToCacheStorage(snapshot: BrowserCacheSnapshot): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    const cache = await caches.open(CACHE_STORAGE_NAME);
    const response = new Response(JSON.stringify(snapshot), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=315360000, immutable'
      }
    });
    await cache.put(CACHE_STORAGE_URL, response);
  } catch {
    // Ignore if CacheStorage is unavailable in private browsing
  }
}

/**
 * Loads driver slots from the browser's CacheStorage API (`window.caches`).
 */
async function loadSlotsFromCacheStorage(): Promise<BrowserCacheSnapshot | null> {
  try {
    if (typeof caches === 'undefined') return null;
    const cache = await caches.open(CACHE_STORAGE_NAME);
    const match = await cache.match(CACHE_STORAGE_URL);
    if (!match) return null;
    const data = (await match.json()) as BrowserCacheSnapshot;
    if (data && Array.isArray(data.slots)) {
      const normalized = normalizeSlots(data.slots);
      if (normalized) {
        return { slots: normalized, updatedAt: data.updatedAt || 0 };
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Saves the 4 driver slots across localStorage, CacheStorage, and IndexedDB in the user's browser.
 */
export function saveSlotsToBrowserCache(slots: (Driver | null)[]): void {
  const normalized = normalizeSlots(slots) || [null, null, null, null];
  const snapshot: BrowserCacheSnapshot = {
    slots: normalized,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(SLOTS_CACHE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Erro ao salvar slots no localStorage:', err);
  }

  void saveSlotsToCacheStorage(snapshot);
  void saveSlotsToIndexedDB(snapshot);
}

/**
 * Recovers driver slots from CacheStorage or IndexedDB if localStorage is empty on initial load.
 */
export async function recoverSlotsFromBrowserCacheIfNeeded(
  currentSlots: (Driver | null)[]
): Promise<(Driver | null)[] | null> {
  if (hasAnyDriver(currentSlots)) {
    // Ensure mirrors are synced with existing localStorage data
    saveSlotsToBrowserCache(currentSlots);
    return null;
  }

  const [cacheSnap, idbSnap] = await Promise.all([
    loadSlotsFromCacheStorage(),
    loadSlotsFromIndexedDB()
  ]);

  const candidates = [cacheSnap, idbSnap].filter(
    (c): c is BrowserCacheSnapshot => c !== null && hasAnyDriver(c.slots)
  );

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.updatedAt - a.updatedAt);
  const best = candidates[0].slots;

  try {
    localStorage.setItem(SLOTS_CACHE_KEY, JSON.stringify(best));
  } catch {
    // Ignore
  }

  return best;
}
