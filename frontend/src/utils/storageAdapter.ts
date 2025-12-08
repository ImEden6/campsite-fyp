/**
 * Custom Storage Adapter for Zustand Persist
 * Handles localStorage quota exceeded errors gracefully
 */

import type { StateStorage } from 'zustand/middleware';

const STORAGE_KEY = 'campsite-map-storage';
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit (leave room for other data)
const MAX_MAPS_TO_KEEP = 10; // Keep only the most recent N maps

interface StorageData {
  maps: unknown[];
  selectedMapId: string | null;
  timestamp?: number;
}

/**
 * Get the size of a string in bytes
 */
function getStringSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Compress data by removing unnecessary fields and optimizing structure
 */
function compressData(data: StorageData): StorageData {
  // Sort maps by updatedAt (most recent first) and keep only the most recent ones
  const sortedMaps = [...(data.maps || [])].sort((a: any, b: any) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

  // Keep only the most recent maps
  const mapsToKeep = sortedMaps.slice(0, MAX_MAPS_TO_KEEP);

  return {
    maps: mapsToKeep,
    selectedMapId: data.selectedMapId,
    timestamp: Date.now(),
  };
}

/**
 * Check if we're approaching storage limits
 */
function checkStorageSize(data: string): boolean {
  const size = getStringSize(data);
  return size > MAX_STORAGE_SIZE;
}

/**
 * Get current storage usage
 */
function getStorageUsage(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += getStringSize(key + value);
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Custom storage adapter with quota handling
 */
export const quotaAwareStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      // Check if we're approaching the limit
      if (checkStorageSize(value)) {
        // Try to compress the data
        try {
          const parsed = JSON.parse(value) as StorageData;
          const compressed = compressData(parsed);
          const compressedValue = JSON.stringify(compressed);
          
          // If compressed data is still too large, remove oldest maps
          if (checkStorageSize(compressedValue)) {
            console.warn('Storage quota exceeded. Removing oldest maps.');
            
            // Keep only the most recent 5 maps
            const furtherCompressed = {
              ...compressed,
              maps: compressed.maps.slice(0, 5),
            };
            const finalValue = JSON.stringify(furtherCompressed);
            
            localStorage.setItem(name, finalValue);
            
            // Show user notification
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('storage-quota-warning', {
                detail: {
                  message: 'Storage is full. Some older maps have been removed to free up space.',
                  action: 'cleanup',
                },
              });
              window.dispatchEvent(event);
            }
            return;
          }
          
          // Use compressed data
          localStorage.setItem(name, compressedValue);
          
          if (compressed.maps.length < parsed.maps.length) {
            console.warn(`Compressed storage: kept ${compressed.maps.length} of ${parsed.maps.length} maps`);
            
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('storage-quota-warning', {
                detail: {
                  message: `Storage space is limited. Kept only the ${compressed.maps.length} most recent maps.`,
                  action: 'compress',
                },
              });
              window.dispatchEvent(event);
            }
          }
          return;
        } catch (parseError) {
          console.error('Failed to compress storage data:', parseError);
        }
      }

      // Try to set the item
      localStorage.setItem(name, value);
    } catch (error: unknown) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        
        try {
          // Try to compress and save
          const parsed = JSON.parse(value) as StorageData;
          const compressed = compressData(parsed);
          const compressedValue = JSON.stringify(compressed);
          
          localStorage.setItem(name, compressedValue);
          
          // Notify user
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('storage-quota-error', {
              detail: {
                message: 'Storage quota exceeded. Some older maps have been removed.',
                action: 'quota-exceeded',
              },
            });
            window.dispatchEvent(event);
          }
        } catch (fallbackError) {
          console.error('Failed to save compressed data:', fallbackError);
          
          // Last resort: clear old data and try again
          try {
            // Remove the oldest maps
            const current = localStorage.getItem(name);
            if (current) {
              const parsed = JSON.parse(current) as StorageData;
              const minimal = {
                maps: parsed.maps.slice(0, 3), // Keep only 3 most recent
                selectedMapId: parsed.selectedMapId,
                timestamp: Date.now(),
              };
              localStorage.setItem(name, JSON.stringify(minimal));
              
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('storage-quota-error', {
                  detail: {
                    message: 'Storage is full. Only the 3 most recent maps are kept.',
                    action: 'emergency-cleanup',
                  },
                });
                window.dispatchEvent(event);
              }
            }
          } catch (emergencyError) {
            console.error('Emergency cleanup failed:', emergencyError);
            
            // Final fallback: clear this key and notify
            localStorage.removeItem(name);
            
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('storage-quota-error', {
                detail: {
                  message: 'Unable to save map data. Please free up browser storage space.',
                  action: 'clear-failed',
                },
              });
              window.dispatchEvent(event);
            }
          }
        }
      } else {
        // Other storage errors
        console.error('localStorage error:', error);
      }
    }
  },

  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
};

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  total: number;
  used: number;
  available: number;
  percentage: number;
} {
  const used = getStorageUsage();
  // Estimate total available (varies by browser, typically 5-10MB)
  const total = 5 * 1024 * 1024; // 5MB estimate
  const available = Math.max(0, total - used);
  const percentage = (used / total) * 100;

  return {
    total,
    used,
    available,
    percentage: Math.min(100, percentage),
  };
}

/**
 * Clear old map data to free up space
 */
export function clearOldMaps(keepCount: number = 5): void {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current) as StorageData;
      const cleaned = {
        maps: parsed.maps.slice(0, keepCount),
        selectedMapId: parsed.selectedMapId,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
  } catch (error) {
    console.error('Failed to clear old maps:', error);
  }
}
