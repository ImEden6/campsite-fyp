/**
 * Toolbar
 * Editor toolbar with tools and controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Move,
  MousePointer,
  RotateCw,
  Square,
  Maximize2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapCommands } from '../../hooks/useMapCommands';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useViewportService } from '../../hooks/useViewportService';
import { useMapService } from '../../hooks/useMapService';
import { useMapEditorContext } from '../../context/MapEditorContext';
import { useToast } from '@/hooks/useToast';
import { bulkUpdateModules } from '@/services/api';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
import type { ToolType } from '../../core/services';

interface ToolbarProps {
  mapId?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ mapId }) => {
  const {
    currentTool,
    showGrid,
    toggleGrid,
    setTool,
    getSelection,
  } = useEditorService();
  const { canUndo, canRedo, undo, redo } = useMapCommands();
  const { eventBus } = useMapEditor();
  const viewportService = useViewportService();
  const mapService = useMapService();
  const { validationService } = useMapEditorContext();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(viewportService.getViewport());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Map<string, string[]>>(new Map());

  // Get current map
  const currentMap = mapId ? mapService.getMap(mapId) : null;

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Listen to viewport changes
  useEffect(() => {
    const unsubscribe = eventBus.on('viewport:change', (payload) => {
      setViewport({ zoom: payload.zoom, position: payload.position });
    });
    return unsubscribe;
  }, [eventBus]);

  // Listen to save requests (e.g., from keyboard shortcuts)
  useEffect(() => {
    const unsubscribe = eventBus.on('map:save-request', () => {
      handleSave();
    });
    return unsubscribe;
  }, [eventBus, handleSave]);

  // Track unsaved changes
  useEffect(() => {
    const unsubscribers = [
      eventBus.on('module:add', () => setHasUnsavedChanges(true)),
      eventBus.on('module:delete', () => setHasUnsavedChanges(true)),
      eventBus.on('module:update', () => setHasUnsavedChanges(true)),
      eventBus.on('module:move', () => setHasUnsavedChanges(true)),
      eventBus.on('module:resize', () => setHasUnsavedChanges(true)),
      eventBus.on('module:rotate', () => setHasUnsavedChanges(true)),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [eventBus]);

  // Validate modules when they change
  useEffect(() => {
    if (!currentMap) return;

    const errors = new Map<string, string[]>();
    currentMap.modules.forEach((module) => {
      const validation = validationService.validateModule(module, currentMap.bounds);
      if (!validation.isValid && validation.errors.length > 0) {
        errors.set(module.id, validation.errors.map((e) => e.code));
      }
    });
    setValidationErrors(errors);
  }, [currentMap, validationService]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const tools: Array<{ id: ToolType; icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'move', icon: Move, label: 'Pan' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'scale', icon: Square, label: 'Scale' },
  ];

  const handleToolChange = (tool: ToolType) => {
    setTool(tool);
    eventBus.emit('tool:change', { tool });
  };

  const handleZoomIn = useCallback(() => {
    viewportService.zoomIn();
  }, [viewportService]);

  const handleZoomOut = useCallback(() => {
    viewportService.zoomOut();
  }, [viewportService]);

  const handleFitToScreen = useCallback(() => {
    if (!currentMap || containerSize.width === 0) return;
    viewportService.fitToScreen(
      {
        width: currentMap.imageSize.width,
        height: currentMap.imageSize.height,
      },
      containerSize
    );
  }, [viewportService, currentMap, containerSize]);

  const handleZoomToSelection = useCallback(() => {
    if (!currentMap || containerSize.width === 0) return;
    const selectedIds = getSelection();
    if (selectedIds.length === 0) return;

    const selectedModules = currentMap.modules.filter((m) =>
      selectedIds.includes(m.id)
    );
    if (selectedModules.length === 0) return;

    // Calculate bounding box
    const bounds = selectedModules.reduce(
      (acc, module) => {
        const minX = Math.min(acc.minX, module.position.x);
        const minY = Math.min(acc.minY, module.position.y);
        const maxX = Math.max(acc.maxX, module.position.x + module.size.width);
        const maxY = Math.max(acc.maxY, module.position.y + module.size.height);
        return { minX, minY, maxX, maxY };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    viewportService.zoomToSelection(bounds, containerSize);
  }, [viewportService, currentMap, containerSize, getSelection]);

  const handleZoomSliderChange = useCallback(
    (value: number) => {
      const clampedZoom = Math.max(
        EDITOR_CONSTANTS.MIN_ZOOM,
        Math.min(EDITOR_CONSTANTS.MAX_ZOOM, value)
      );
      viewportService.setViewport({ zoom: clampedZoom });
    },
    [viewportService]
  );

  const handleResetView = useCallback(() => {
    viewportService.reset();
  }, [viewportService]);

  const handleSave = useCallback(async () => {
    if (!currentMap || !mapId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Validate all modules before saving
      if (validationErrors.size > 0) {
        const errorCount = validationErrors.size;
        showToast(
          `⚠️ Cannot save: ${errorCount} module${errorCount > 1 ? 's have' : ' has'} validation errors`,
          'error',
          EDITOR_CONSTANTS.TOAST_DURATION.ERROR
        );
        setIsSaving(false);
        return;
      }

      // Save map metadata
      await mapService.updateMap(mapId, {
        name: currentMap.name,
        description: currentMap.description,
        metadata: currentMap.metadata,
      });

      // Save all modules
      const moduleUpdates = currentMap.modules.map((module) => ({
        id: module.id,
        position: module.position,
        size: module.size,
        rotation: module.rotation,
        metadata: module.metadata,
        locked: module.locked,
        visible: module.visible,
      }));

      await bulkUpdateModules({
        mapId,
        modules: moduleUpdates,
      });

      setHasUnsavedChanges(false);
      setSaveError(null);
      eventBus.emit('map:save', { mapId, success: true });
      showToast('✓ Map saved successfully', 'success', EDITOR_CONSTANTS.TOAST_DURATION.LONG);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveError(errorMessage);
      eventBus.emit('map:save', { mapId, success: false });
      showToast(
        `✗ Failed to save map: ${errorMessage}. Click Retry to try again.`,
        'error',
        EDITOR_CONSTANTS.TOAST_DURATION.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }, [currentMap, mapId, mapService, validationErrors, eventBus, showToast]);

  const selectedIds = getSelection();
  const hasSelection = selectedIds.length > 0;

  return (
    <div
      ref={containerRef}
      className="toolbar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        {/* Tool Buttons */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolChange(tool.id)}
                className={`p-2 rounded-md transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={tool.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Slider */}
          <div className="flex items-center space-x-2 w-32">
            <label htmlFor="zoom-slider" className="sr-only">
              Zoom level slider
            </label>
            <input
              id="zoom-slider"
              type="range"
              min={EDITOR_CONSTANTS.MIN_ZOOM}
              max={EDITOR_CONSTANTS.MAX_ZOOM}
              step={0.01}
              value={viewport.zoom}
              onChange={(e) => handleZoomSliderChange(parseFloat(e.target.value))}
              aria-label={`Zoom level ${Math.round(viewport.zoom * 100)} percent`}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <button
            onClick={handleResetView}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all min-w-[60px]"
            title={`Current zoom: ${Math.round(viewport.zoom * 100)}%. Click to reset to 100%.`}
          >
            {Math.round(viewport.zoom * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={handleFitToScreen}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomToSelection}
            disabled={!hasSelection}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              hasSelection
                ? `Zoom to ${selectedIds.length} selected module${selectedIds.length > 1 ? 's' : ''}`
                : 'Select modules to zoom'
            }
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* View Options */}
        <button
          onClick={toggleGrid}
          className={`p-2 rounded-md ${
            showGrid
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* History Controls */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-2">
            {validationErrors.size > 0 ? (
              <span className="text-xs text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.size} error{validationErrors.size > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>
        )}

        {/* Save Error */}
        {saveError && (
          <div className="flex items-center space-x-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            <span>Save failed</span>
            <button
              onClick={handleSave}
              className="px-2 py-0.5 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 rounded font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || (!hasUnsavedChanges && !saveError) || validationErrors.size > 0}
          className="btn-primary btn-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed relative"
          title={
            validationErrors.size > 0
              ? 'Fix validation errors before saving'
              : 'Save Map (Ctrl+S)'
          }
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save</span>
            </>
          )}
          {validationErrors.size > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white">
              !
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

