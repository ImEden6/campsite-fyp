/**
 * Hook for accessing ViewportService
 */

import { useMapEditorContext } from '../context/MapEditorContext';

export function useViewportService() {
  const { viewportService } = useMapEditorContext();
  return viewportService;
}

