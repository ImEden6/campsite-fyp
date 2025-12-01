/**
 * Auto-save Hook
 * Automatically saves map changes with debouncing
 */

import { useEffect, useRef, useCallback } from 'react';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
  delay?: number; // Debounce delay in milliseconds
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook for auto-saving data with debouncing
 * @param options - Auto-save configuration
 */
export function useAutoSave<T>({
  data,
  onSave,
  enabled = true,
  delay = 2000, // Default 2 seconds
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T>) {
  const isSavingRef = useRef(false);
  const lastSavedDataRef = useRef<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(async (dataToSave: T) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      // Skip if already saving or data hasn't changed
      if (isSavingRef.current) {
        return;
      }

      // Compare with last saved data (shallow comparison)
      if (lastSavedDataRef.current === dataToSave) {
        return;
      }

      try {
        isSavingRef.current = true;
        onSaveStart?.();
        
        await onSave(dataToSave);
        
        lastSavedDataRef.current = dataToSave;
        onSaveSuccess?.();
      } catch (error) {
        errorLogger.error(
          ErrorCategory.NETWORK,
          'Auto-save failed',
          { data: dataToSave },
          error as Error
        );
        onSaveError?.(error as Error);
      } finally {
        isSavingRef.current = false;
      }
    }, delay);
  }, [onSave, onSaveStart, onSaveSuccess, onSaveError, delay]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Trigger debounced save when data changes
    debouncedSave(data);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  // Manual save function (immediate, bypasses debounce)
  const saveNow = useCallback(async () => {
    // Clear pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      onSaveStart?.();
      
      await onSave(data);
      
      lastSavedDataRef.current = data;
      onSaveSuccess?.();
    } catch (error) {
      errorLogger.error(
        ErrorCategory.NETWORK,
        'Manual save failed',
        { data },
        error as Error
      );
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave, onSaveStart, onSaveSuccess, onSaveError]);

  return {
    saveNow,
    isSaving: isSavingRef.current,
  };
}

