/**
 * Map Editor Context
 * Provides services and infrastructure via dependency injection
 */

import React, { createContext, useContext, useMemo } from 'react';
import { createEventBus } from '../infrastructure/EventBus';
import { createCommandBus } from '../infrastructure/CommandBus';
import { ZustandMapRepository } from '../infrastructure/ZustandRepository';
import { MapService } from '../services/MapService';
import { EditorService } from '../services/EditorService';
import { HistoryService } from '../services/HistoryService';
import { ValidationService } from '../services/ValidationService';
import { ViewportService } from '../services/ViewportService';
import { createRenderer } from '../renderers/RendererFactory';
import type {
  IMapService,
  IEditorService,
  IHistoryService,
  IValidationService,
  IRenderer,
} from '../core/services';
import type { IViewportService } from '../services/ViewportService';
import type { EventBus } from '../infrastructure/EventBus';
import type { CommandBus } from '../infrastructure/CommandBus';

interface MapEditorContextValue {
  mapService: IMapService;
  editorService: IEditorService;
  historyService: IHistoryService;
  validationService: IValidationService;
  viewportService: IViewportService;
  renderer: IRenderer;
  eventBus: EventBus;
  commandBus: CommandBus;
}

const MapEditorContext = createContext<MapEditorContextValue | null>(null);

interface MapEditorProviderProps {
  children: React.ReactNode;
}

export const MapEditorProvider: React.FC<MapEditorProviderProps> = ({
  children,
}) => {
  // Create infrastructure instances
  const eventBus = useMemo(() => createEventBus(), []);
  const commandBus = useMemo(() => createCommandBus({ maxHistorySize: 50 }), []);
  const repository = useMemo(() => new ZustandMapRepository(), []);

  // Create services
  const mapService = useMemo(
    () => new MapService(repository, eventBus),
    [repository, eventBus]
  );
  const editorService = useMemo(
    () => new EditorService(eventBus),
    [eventBus]
  );
  const historyService = useMemo(
    () => new HistoryService(commandBus),
    [commandBus]
  );
  const validationService = useMemo(() => new ValidationService(), []);
  const viewportService = useMemo(
    () => new ViewportService(eventBus),
    [eventBus]
  );
  const renderer = useMemo(() => createRenderer('svg'), []);

  const value: MapEditorContextValue = useMemo(
    () => ({
      mapService,
      editorService,
      historyService,
      validationService,
      viewportService,
      renderer,
      eventBus,
      commandBus,
    }),
    [
      mapService,
      editorService,
      historyService,
      validationService,
      viewportService,
      renderer,
      eventBus,
      commandBus,
    ]
  );

  return (
    <MapEditorContext.Provider value={value}>
      {children}
    </MapEditorContext.Provider>
  );
};

/**
 * Hook to access map editor context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useMapEditorContext(): MapEditorContextValue {
  const context = useContext(MapEditorContext);
  if (!context) {
    throw new Error(
      'useMapEditorContext must be used within MapEditorProvider'
    );
  }
  return context;
}

