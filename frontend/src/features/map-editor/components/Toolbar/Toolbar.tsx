/**
 * Toolbar
 * Editor toolbar with tools and controls
 */

import React from 'react';
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
} from 'lucide-react';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapCommands } from '../../hooks/useMapCommands';
import { useMapEditor } from '../../hooks/useMapEditor';
import type { ToolType } from '../../core/services';

export const Toolbar: React.FC = () => {
  const {
    currentTool,
    showGrid,
    toggleGrid,
    setTool,
  } = useEditorService();
  const { canUndo, canRedo, undo, redo } = useMapCommands();
  const { eventBus } = useMapEditor();

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

  const handleZoomIn = () => {
    // TODO: Implement zoom in via viewport service
  };

  const handleZoomOut = () => {
    // TODO: Implement zoom out via viewport service
  };

  const handleFitToScreen = () => {
    // TODO: Implement fit to screen
  };

  return (
    <div className="toolbar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
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
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
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

        {/* Save Button */}
        <button
          className="btn-primary btn-sm flex items-center space-x-2"
          title="Save Map"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
};

