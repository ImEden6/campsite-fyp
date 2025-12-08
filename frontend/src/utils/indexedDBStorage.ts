/**
 * IndexedDB Storage Adapter for Zustand Persist
 * Uses browser IndexedDB for larger storage capacity
 * 
 * Note: Zustand persist supports async storage adapters
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'campsite-storage';
const DB_VERSION = 1;
const STORE_NAME = 'maps';

interface CampsiteDB extends DBSchema {
  maps: {
    key: string;
    value: string;
  };
}

let dbPromise: Promise<IDBPDatabase<CampsiteDB>> | null = null;

/**
 * Get or create the IndexedDB database
 */
function getDB(): Promise<IDBPDatabase<CampsiteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CampsiteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * IndexedDB storage adapter for Zustand persist
 * Zustand persist supports async storage - methods can return Promises
 */
export const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await getDB();
      const value = await db.get(STORE_NAME, name);
      return value || null;
    } catch (error) {
      console.warn('Failed to read from IndexedDB:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, value, name);
    } catch (error) {
      console.warn('Failed to write to IndexedDB:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.setItem(name, value);
      } catch (storageError) {
        console.error('Failed to write to localStorage fallback:', storageError);
        throw storageError;
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, name);
    } catch (error) {
      console.warn('Failed to delete from IndexedDB:', error);
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.removeItem(name);
      } catch {
        // Ignore localStorage errors
      }
    }
  },
};

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Get storage usage statistics for IndexedDB
 */
export async function getIndexedDBStats(): Promise<{
  used: number;
  available: number;
  percentage: number;
}> {
  try {
    if (!isIndexedDBAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const keys = await store.getAllKeys();
    
    let totalSize = 0;
    for (const key of keys) {
      const value = await store.get(key);
      if (value) {
        totalSize += new Blob([key, value]).size;
      }
    }

    // IndexedDB typically has much larger quota (50% of disk space or at least 10MB)
    // We'll estimate available space conservatively
    const estimatedQuota = 50 * 1024 * 1024; // 50MB estimate
    const available = Math.max(0, estimatedQuota - totalSize);
    const percentage = (totalSize / estimatedQuota) * 100;

    return {
      used: totalSize,
      available,
      percentage: Math.min(100, percentage),
    };
  } catch (error) {
    console.error('Failed to get IndexedDB stats:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Clear all data from IndexedDB
 */
export async function clearIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
}
