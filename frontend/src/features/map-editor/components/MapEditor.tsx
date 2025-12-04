/**
 * Map Editor
 * Main orchestrator component for the map editor
 */

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapEditorProvider } from '../../context/MapEditorContext';
import { MapCanvas } from './MapCanvas/MapCanvas';
import { Toolbar } from './Toolbar/Toolbar';
import { ModuleLibrary } from './ModuleLibrary/ModuleLibrary';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { useMapService } from '../../hooks/useMapService';
import { useMapEditor } from '../../hooks/useMapEditor';
import { ZustandMapRepository } from '../../infrastructure/ZustandRepository';

// Temporary wrapper to access services within provider
const MapEditorContent: React.FC<{ mapId: string }> = ({ mapId }) => {
  const mapService = useMapService();
  const { eventBus } = useMapEditor();
  const repository = new ZustandMapRepository();

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
        <Toolbar />

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

