/**
 * Map Editor
 * Main orchestrator component for the map editor
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapEditorProvider } from '../../context/MapEditorContext';
import { MapCanvas } from './MapCanvas/MapCanvas';
import { Toolbar } from './Toolbar/Toolbar';
import { ModuleLibrary } from './ModuleLibrary/ModuleLibrary';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { useMapService } from '../../hooks/useMapService';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useMapCommands } from '../../hooks/useMapCommands';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapEditorShortcuts } from '../../hooks/useMapEditorShortcuts';
import { ZustandMapRepository } from '../../infrastructure/ZustandRepository';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
import type { AnyModule, Position } from '@/types';

// Temporary wrapper to access services within provider
const MapEditorContent: React.FC<{ mapId: string }> = ({ mapId }) => {
  const mapService = useMapService();
  const { eventBus } = useMapEditor();
  const { addModule, moveModule } = useMapCommands();
  const editorService = useEditorService();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clipboard, setClipboard] = useState<AnyModule[]>([]);
  const [isCut, setIsCut] = useState(false);
  // Memoize repository instance to prevent recreation on every render
  const repository = useMemo(() => new ZustandMapRepository(), []);

  // Handle save
  const handleSave = useCallback(() => {
    // Emit event to trigger save in Toolbar component
    eventBus.emit('map:save-request', {});
  }, [eventBus]);

  // Handle clipboard operations
  useEffect(() => {
    const unsubscribers = [
      // Copy
      eventBus.on('clipboard:copy', (payload) => {
        const map = mapService.getMap(mapId);
        if (map) {
          const modules = map.modules.filter((m) => payload.moduleIds.includes(m.id));
          setClipboard(modules);
          setIsCut(false);
        }
      }),

      // Cut
      eventBus.on('clipboard:cut', (payload) => {
        const map = mapService.getMap(mapId);
        if (map) {
          const modules = map.modules.filter((m) => payload.moduleIds.includes(m.id));
          setClipboard(modules);
          setIsCut(true);
        }
      }),

      // Paste
      eventBus.on('clipboard:paste', () => {
        if (clipboard.length === 0) return;
        const map = mapService.getMap(mapId);
        if (!map) return;

        const offset = EDITOR_CONSTANTS.PASTE_OFFSET;
        const newModules = clipboard.map((module) => {
          const newId = `module-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          return {
            ...module,
            id: newId,
            position: {
              x: module.position.x + offset.x,
              y: module.position.y + offset.y,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          } as AnyModule;
        });

        newModules.forEach((module) => {
          addModule(mapId, module);
        });

        editorService.selectModules(newModules.map((m) => m.id));
        setHasUnsavedChanges(true);

        // If it was a cut, delete the original modules
        if (isCut) {
          const originalIds = clipboard.map((m) => m.id);
          originalIds.forEach((id) => {
            mapService.removeModule(mapId, id);
          });
          setIsCut(false);
          setClipboard([]);
        }
      }),

      // Duplicate
      eventBus.on('clipboard:duplicate', (payload) => {
        const map = mapService.getMap(mapId);
        if (!map) return;

        const modules = map.modules.filter((m) => payload.moduleIds.includes(m.id));
        const offset = EDITOR_CONSTANTS.DUPLICATE_OFFSET;

        const newModules = modules.map((module) => {
          const newId = `module-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
          return {
            ...module,
            id: newId,
            position: {
              x: module.position.x + offset.x,
              y: module.position.y + offset.y,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          } as AnyModule;
        });

        newModules.forEach((module) => {
          addModule(mapId, module);
        });

        editorService.selectModules(newModules.map((m) => m.id));
        setHasUnsavedChanges(true);
      }),

      // Arrow key movement
      eventBus.on('module:move-arrow', (payload) => {
        const selectedIds = editorService.getSelection();
        if (selectedIds.length === 0) return;

        const map = mapService.getMap(mapId);
        if (!map) return;

        const selectedModules = map.modules.filter((m) => selectedIds.includes(m.id));

        selectedModules.forEach((module) => {
          const newPosition: Position = { ...module.position };

          switch (payload.direction) {
            case 'up':
              newPosition.y -= payload.distance;
              break;
            case 'down':
              newPosition.y += payload.distance;
              break;
            case 'left':
              newPosition.x -= payload.distance;
              break;
            case 'right':
              newPosition.x += payload.distance;
              break;
          }

          moveModule(mapId, module.id, newPosition, module.position);
        });

        setHasUnsavedChanges(true);
      }),

      // Track unsaved changes
      eventBus.on('module:add', () => setHasUnsavedChanges(true)),
      eventBus.on('module:delete', () => setHasUnsavedChanges(true)),
      eventBus.on('module:update', () => setHasUnsavedChanges(true)),
      eventBus.on('module:move', () => setHasUnsavedChanges(true)),
      eventBus.on('module:resize', () => setHasUnsavedChanges(true)),
      eventBus.on('module:rotate', () => setHasUnsavedChanges(true)),
      eventBus.on('map:save', (payload) => {
        if (payload.success) {
          setHasUnsavedChanges(false);
        }
        setIsSaving(false);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    mapId,
    eventBus,
    mapService,
    addModule,
    moveModule,
    editorService,
    clipboard,
    isCut,
  ]);

  // Keyboard shortcuts
  useMapEditorShortcuts({
    enabled: !!mapId,
    mapId,
    hasUnsavedChanges,
    isSaving,
    onSave: handleSave,
  });

  useEffect(() => {
    // Load map when component mounts
    const map = mapService.getMap(mapId);
    if (map) {
      repository.selectMap(mapId);
      eventBus.emit('map:load', { mapId, map });
    }
  }, [mapId, mapService, eventBus, repository]);

  const map = mapService.getMap(mapId);

  if (!map) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Map not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The requested map could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900">
      {/* Module Library Sidebar */}
      <ModuleLibrary />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <Toolbar mapId={mapId} />

        {/* Canvas */}
        <div className="flex-1 relative">
          <MapCanvas mapId={mapId} />
        </div>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel mapId={mapId} />
    </div>
  );
};

export const MapEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No map ID provided</p>
      </div>
    );
  }

  return (
    <MapEditorProvider>
      <MapEditorContent mapId={id} />
    </MapEditorProvider>
  );
};

