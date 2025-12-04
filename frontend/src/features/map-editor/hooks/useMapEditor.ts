/**
 * useMapEditor Hook
 * Main hook for accessing map editor services
 */

import { useMapEditorContext } from '../context/MapEditorContext';

/**
 * Main hook for accessing map editor services and infrastructure
 */
export function useMapEditor() {
  return useMapEditorContext();
}

