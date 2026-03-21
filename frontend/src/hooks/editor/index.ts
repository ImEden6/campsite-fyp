/**
 * Editor Hooks
 * Barrel export for all map editor hooks.
 * 
 * @see useMapEditor - Composite hook for full editor functionality
 */

// Core canvas
export { useFabricCanvas } from './useFabricCanvas';
export type { UseFabricCanvasOptions, UseFabricCanvasReturn } from './useFabricCanvas';

// Pan and zoom
export { usePanZoom } from './usePanZoom';
export type { UsePanZoomOptions, UsePanZoomReturn } from './usePanZoom';

// Selection management
export { useSelectionManager } from './useSelectionManager';
export type { UseSelectionManagerOptions, UseSelectionManagerReturn } from './useSelectionManager';

// Grid
export { useGrid } from './useGrid';
export type { UseGridOptions, UseGridReturn } from './useGrid';

// Input handling
export { useInputHandler } from './useInputHandler';
export type { UseInputHandlerOptions, UseInputHandlerReturn } from './useInputHandler';

// Transform handling
export { useTransformHandler } from './useTransformHandler';
export type { UseTransformHandlerOptions, UseTransformHandlerReturn } from './useTransformHandler';

// Module rendering
export { useModuleRenderer } from './useModuleRenderer';
export type { UseModuleRendererOptions, UseModuleRendererReturn } from './useModuleRenderer';

// Editor shortcuts
export { useEditorShortcuts } from './useEditorShortcuts';
export type { UseEditorShortcutsOptions, UseEditorShortcutsReturn } from './useEditorShortcuts';

// Command facade
export { useCommandFacade } from './useCommandFacade';
export type { UseCommandFacadeReturn } from './useCommandFacade';

// Editor lifecycle
export { useEditorLifecycle } from './useEditorLifecycle';
export type { UseEditorLifecycleOptions, UseEditorLifecycleReturn } from './useEditorLifecycle';

// Composite hook (main entry point)
export { useMapEditor } from './useMapEditor';
export type { UseMapEditorOptions, UseMapEditorReturn } from './useMapEditor';

// Map save with useMutation
export { useMapSave } from './useMapSave';
export type { UseMapSaveOptions, UseMapSaveReturn } from './useMapSave';
