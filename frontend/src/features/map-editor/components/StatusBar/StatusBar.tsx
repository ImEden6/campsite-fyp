/**
 * Status Bar
 * Displays editor status information at the bottom of the canvas
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useEditorService } from '../../hooks/useEditorService';
import { useViewportService } from '../../hooks/useViewportService';
import { useMapService } from '../../hooks/useMapService';
import { useMapEditor } from '../../hooks/useMapEditor';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';

interface StatusBarProps {
  mapId: string;
  validationErrors?: Map<string, string[]>;
  hasUnsavedChanges?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  mapId,
  validationErrors = new Map(),
  hasUnsavedChanges = false,
}) => {
  const editorService = useEditorService();
  const viewportService = useViewportService();
  const mapService = useMapService();
  const { eventBus } = useMapEditor();

  const [viewport, setViewport] = React.useState(viewportService.getViewport());
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Listen to viewport changes
  React.useEffect(() => {
    const unsubscribe = eventBus.on('viewport:change', (payload) => {
      setViewport({ zoom: payload.zoom, position: payload.position });
    });
    return unsubscribe;
  }, [eventBus]);

  // Listen to selection changes
  React.useEffect(() => {
    const unsubscribe = eventBus.on('selection:change', (payload) => {
      setSelectedIds(payload.selectedModuleIds);
    });
    return unsubscribe;
  }, [eventBus]);

  const map = mapService.getMap(mapId);
  const totalModules = map?.modules.length || 0;
  const errorCount = validationErrors.size;
  const showGrid = editorService.isGridVisible();
  const gridSize = editorService.getGridSize();
  const snapToGrid = editorService.isSnapToGrid();

  const handleZoomClick = () => {
    viewportService.reset();
  };

  const handleGridClick = () => {
    editorService.toggleGrid();
  };

  const handleSnapClick = () => {
    editorService.toggleSnapToGrid();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-between px-4 text-sm">
      <div className="flex items-center space-x-6">
        {/* Zoom */}
        <button
          onClick={handleZoomClick}
          className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
          title="Click to reset zoom to 100%"
        >
          Zoom: {Math.round(viewport.zoom * 100)}%
        </button>

        <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Selection Count */}
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {selectedIds.length}
          </span>{' '}
          selected
        </span>

        {/* Total Modules */}
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">{totalModules}</span>{' '}
          modules
        </span>

        {/* Validation Errors */}
        {errorCount > 0 && (
          <>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
            <span className="text-red-600 dark:text-red-400 font-medium flex items-center cursor-help">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-6">
        {/* Grid Size */}
        <button
          onClick={handleGridClick}
          className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
            showGrid ? 'font-medium text-gray-900 dark:text-gray-100' : ''
          }`}
          title={`Grid size: ${gridSize}px. Click to toggle grid.`}
        >
          Grid: {gridSize}px
        </button>

        {/* Snap to Grid */}
        <button
          onClick={handleSnapClick}
          className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
            snapToGrid ? 'font-medium text-gray-900 dark:text-gray-100' : ''
          }`}
          title="Click to toggle snap to grid"
        >
          Snap: {snapToGrid ? 'On' : 'Off'}
        </button>

        {/* Unsaved Changes */}
        {hasUnsavedChanges && (
          <>
            <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsaved
            </span>
          </>
        )}
      </div>
    </div>
  );
};

