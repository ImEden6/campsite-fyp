/**
 * useEditorService Hook
 * Hook for accessing editor service with reactive state
 */

import { useState, useEffect } from 'react';
import { useMapEditor } from './useMapEditor';
import type { ToolType, ModuleType } from '../core/services';

/**
 * Hook for accessing editor service with reactive state
 */
export function useEditorService() {
  const { editorService } = useMapEditor();
  const [state, setState] = useState(editorService.getState());

  useEffect(() => {
    const unsubscribe = editorService.subscribe(setState);
    return unsubscribe;
  }, [editorService]);

  return {
    // State
    selection: state.selectedModuleIds,
    currentTool: state.currentTool,
    showGrid: state.showGrid,
    gridSize: state.gridSize,
    snapToGrid: state.snapToGrid,
    showRulers: state.showRulers,
    layerVisibility: state.layerVisibility,

    // Methods
    selectModules: (moduleIds: string[]) => editorService.selectModules(moduleIds),
    addToSelection: (moduleIds: string[]) => editorService.addToSelection(moduleIds),
    removeFromSelection: (moduleIds: string[]) =>
      editorService.removeFromSelection(moduleIds),
    clearSelection: () => editorService.clearSelection(),
    setTool: (tool: ToolType) => editorService.setTool(tool),
    toggleGrid: () => editorService.toggleGrid(),
    setGridSize: (size: number) => editorService.setGridSize(size),
    toggleSnapToGrid: () => editorService.toggleSnapToGrid(),
    toggleRulers: () => editorService.toggleRulers(),
    toggleLayerVisibility: (layer: ModuleType) =>
      editorService.toggleLayerVisibility(layer),
  };
}

