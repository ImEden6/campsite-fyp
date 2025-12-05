/**
 * useScreenReaderAnnouncements Hook
 * Provides debounced screen reader announcements for accessibility
 */

import { useEffect, useMemo } from 'react';
import { announce } from '@/utils/accessibility';
import { debounce } from '@/utils/performanceUtils';
import type { AnyModule } from '@/types';

export interface UseScreenReaderAnnouncementsOptions {
  selectedIds: string[];
  modules: AnyModule[];
  currentTool?: string;
}

/**
 * Hook for managing screen reader announcements
 * Debounces rapid announcements to prevent spam
 */
export function useScreenReaderAnnouncements({
  selectedIds,
  modules,
  currentTool,
}: UseScreenReaderAnnouncementsOptions) {
  // Debounce announcements to prevent spam during rapid changes
  const debouncedAnnounce = useMemo(
    () => debounce((message: string) => announce(message), 300),
    []
  );

  // Announce selection changes
  useEffect(() => {
    if (selectedIds.length > 0) {
      const moduleNames = selectedIds
        .map((id) => modules.find((m) => m.id === id))
        .filter(Boolean)
        .map((m) => {
          if (!m) return 'Unnamed';
          return m.metadata && 'name' in m.metadata
            ? String(m.metadata.name)
            : 'Unnamed';
        })
        .join(', ');

      debouncedAnnounce(
        `${selectedIds.length} module${selectedIds.length > 1 ? 's' : ''} selected: ${moduleNames}`
      );
    } else {
      debouncedAnnounce('Selection cleared');
    }
  }, [selectedIds, modules, debouncedAnnounce]);

  // Announce tool changes
  useEffect(() => {
    if (currentTool) {
      debouncedAnnounce(`Tool changed to ${currentTool}`);
    }
  }, [currentTool, debouncedAnnounce]);
}

