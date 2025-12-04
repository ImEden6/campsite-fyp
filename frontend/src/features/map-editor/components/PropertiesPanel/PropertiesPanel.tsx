/**
 * Properties Panel
 * Panel for editing selected module properties
 */

import React from 'react';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapService } from '../../hooks/useMapService';

interface PropertiesPanelProps {
  mapId: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ mapId }) => {
  const { selection } = useEditorService();
  const mapService = useMapService();

  const modules = mapService.getModules(mapId);
  const selectedModules = modules.filter((m) => selection.includes(m.id));
  const selectedModule = selectedModules.length === 1 ? selectedModules[0] : null;

  if (!selectedModule) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Properties
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selection.length === 0
            ? 'Select a module to edit properties'
            : `${selection.length} modules selected`}
        </p>
      </div>
    );
  }

  const handlePropertyChange = async (property: string, value: unknown) => {
    // Handle position and size as top-level properties, not metadata
    if (property === 'position' || property === 'size') {
      const updated = {
        ...selectedModule,
        [property]: value,
        updatedAt: new Date(),
      };

      // mapService.updateModule() already emits 'module:update' event internally
      await mapService.updateModule(mapId, updated);
    } else {
      // Other properties go into metadata
      const updated = {
        ...selectedModule,
        metadata: {
          ...selectedModule.metadata,
          [property]: value,
        },
        updatedAt: new Date(),
      };

      // mapService.updateModule() already emits 'module:update' event internally
      await mapService.updateModule(mapId, updated);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Properties
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">
            {selectedModule.type}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={Math.round(selectedModule.position.x)}
              onChange={(e) =>
                handlePropertyChange('position', {
                  ...selectedModule.position,
                  x: parseFloat(e.target.value) || 0,
                })
              }
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="number"
              value={Math.round(selectedModule.position.y)}
              onChange={(e) =>
                handlePropertyChange('position', {
                  ...selectedModule.position,
                  y: parseFloat(e.target.value) || 0,
                })
              }
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={Math.round(selectedModule.size.width)}
              onChange={(e) =>
                handlePropertyChange('size', {
                  ...selectedModule.size,
                  width: parseFloat(e.target.value) || 0,
                })
              }
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="number"
              value={Math.round(selectedModule.size.height)}
              onChange={(e) =>
                handlePropertyChange('size', {
                  ...selectedModule.size,
                  height: parseFloat(e.target.value) || 0,
                })
              }
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {selectedModule.metadata && 'name' in selectedModule.metadata && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={String(selectedModule.metadata.name || '')}
              onChange={(e) => handlePropertyChange('name', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};

