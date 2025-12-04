/**
 * useEditorService Hook
 * Hook for accessing editor service with reactive state
 */

import { useState, useEffect } from 'react';
import { useMapEditor } from './useMapEditor';
import type { ToolType } from '../core/services';
import type { ModuleType } from '@/types';

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
    getSelection: () => editorService.getSelection(),
    selectModules: (moduleIds: string[]) => editorService.selectModules(moduleIds),
    addToSelection: (moduleIds: string[]) => editorService.addToSelection(moduleIds),
    removeFromSelection: (moduleIds: string[]) =>
      editorService.removeFromSelection(moduleIds),
    clearSelection: () => editorService.clearSelection(),
    setTool: (tool: ToolType) => editorService.setTool(tool),
    isGridVisible: () => editorService.isGridVisible(),
    toggleGrid: () => editorService.toggleGrid(),
    getGridSize: () => editorService.getGridSize(),
    setGridSize: (size: number) => editorService.setGridSize(size),
    isSnapToGrid: () => editorService.isSnapToGrid(),
    toggleSnapToGrid: () => editorService.toggleSnapToGrid(),
    areRulersVisible: () => editorService.areRulersVisible(),
    toggleRulers: () => editorService.toggleRulers(),
    toggleLayerVisibility: (layer: ModuleType) =>
      editorService.toggleLayerVisibility(layer),
  };
}

