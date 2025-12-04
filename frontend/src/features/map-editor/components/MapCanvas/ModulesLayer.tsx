/**
 * Modules Layer
 * Renders all modules on the map
 */

import React, { useEffect } from 'react';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapService } from '../../hooks/useMapService';
import { useMapCommands } from '../../hooks/useMapCommands';
import type { AnyModule, Position } from '@/types';

interface ModulesLayerProps {
  mapId: string;
}

export const ModulesLayer: React.FC<ModulesLayerProps> = ({ mapId }) => {
  const { renderer, eventBus } = useMapEditor();
  const { selection, layerVisibility } = useEditorService();
  const mapService = useMapService();
  const { addModule } = useMapCommands();

  const modules = mapService.getModules(mapId);

  // Listen for module:add events
  useEffect(() => {
    const unsubscribe = eventBus.on('module:add', async (payload) => {
      // Only handle if mapId matches or is empty (will be set)
      if (payload.mapId && payload.mapId !== mapId) {
        return;
      }

      // Calculate drop position based on mouse position
      // For now, place at center - can be enhanced later with actual drop coordinates
      const map = mapService.getMap(mapId);
      if (map) {
        const position: Position = {
          x: map.imageSize.width / 2 - payload.module.size.width / 2,
          y: map.imageSize.height / 2 - payload.module.size.height / 2,
        };
        const moduleWithPosition = {
          ...payload.module,
          position,
        };
        await addModule(mapId, moduleWithPosition);
      }
    });

    return unsubscribe;
  }, [mapId, eventBus, mapService, addModule]);

  // Listen for module:select events
  useEffect(() => {
    const unsubscribe = eventBus.on('module:select', (payload) => {
      // Handle selection via editor service
      // This will be handled by the editor service listener
    });

    return unsubscribe;
  }, [eventBus]);

  // Filter modules by layer visibility
  const visibleModules = modules.filter(
    (module) => layerVisibility[module.type] !== false
  );

  const handleModuleSelect = (moduleId: string, e?: React.MouseEvent) => {
    const multiSelect = e?.shiftKey || false;
    eventBus.emit('module:select', { moduleId, multiSelect });
  };

  return (
    <g className="modules-layer">
      {visibleModules.map((module) => {
        const isSelected = selection.includes(module.id);

        return (
          <React.Fragment key={module.id}>
            {renderer.renderModule(module, {
              isSelected,
              hasValidationErrors: false, // TODO: Get from validation service
              onSelect: (e?: React.MouseEvent) => handleModuleSelect(module.id, e),
            })}
          </React.Fragment>
        );
      })}
      {/* Selection handles for multiple modules */}
      {selection.length > 1 && (
        <g className="selection-handles">
          {renderer.renderSelectionHandles(
            visibleModules.filter((m) => selection.includes(m.id))
          )}
        </g>
      )}
    </g>
  );
};

