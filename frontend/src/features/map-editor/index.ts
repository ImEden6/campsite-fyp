/**
 * Map Editor Feature
 * Main exports for the map editor feature
 */

export { MapEditor } from './components/MapEditor';
export { MapEditorProvider, useMapEditorContext } from './context/MapEditorContext';
export { useMapEditor } from './hooks/useMapEditor';
export { useMapService } from './hooks/useMapService';
export { useEditorService } from './hooks/useEditorService';
export { useMapCommands } from './hooks/useMapCommands';

export type {
  IMapService,
  IEditorService,
  IHistoryService,
  IValidationService,
  IRenderer,
  ToolType,
} from './core/services';

export type {
  MapEditorEvents,
  MapEditorEventName,
} from './core/events';

export type { Command } from './core/commands';

