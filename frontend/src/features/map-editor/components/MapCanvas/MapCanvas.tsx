/**
 * Map Canvas
 * Main SVG canvas container replacing Konva Stage
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import { BackgroundLayer } from './BackgroundLayer';
import { GridLayer } from './GridLayer';
import { ModulesLayer } from './ModulesLayer';
import { useMapService } from '../../hooks/useMapService';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useMapCommands } from '../../hooks/useMapCommands';
import type { Position, ModuleTemplate, AnyModule } from '@/types';

interface MapCanvasProps {
  mapId: string;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ mapId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<{
    zoom: number;
    position: Position;
  }>({
    zoom: 1,
    position: { x: 0, y: 0 },
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  const mapService = useMapService();
  const { currentTool } = useEditorService();
  const { eventBus } = useMapEditor();
  const { addModule } = useMapCommands();

  // Make canvas a drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'map-editor-canvas',
  });

  // Handle drop events
  useDndMonitor({
    onDragEnd: (event) => {
      if (event.over?.id === 'map-editor-canvas' && event.active.data.current?.template) {
        const template = event.active.data.current.template as ModuleTemplate;
        const map = mapService.getMap(mapId);
        
        if (map) {
          // Calculate drop position (simplified - can be enhanced with actual mouse position)
          const position: Position = {
            x: map.imageSize.width / 2 - template.defaultSize.width / 2,
            y: map.imageSize.height / 2 - template.defaultSize.height / 2,
          };

          const newModule: AnyModule = {
            id: `module-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            type: template.type,
            position,
            size: template.defaultSize,
            rotation: 0,
            zIndex: map.modules.length,
            locked: false,
            visible: true,
            metadata: template.defaultMetadata,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as AnyModule;

          addModule(mapId, newModule);
        }
      }
    },
  });

  const map = mapService.getMap(mapId);

  useEffect(() => {
    if (!map) return;

    // Listen to viewport changes
    const unsubscribe = eventBus.on('viewport:change', (payload) => {
      setViewport({
        zoom: payload.zoom,
        position: payload.position,
      });
    });

    return unsubscribe;
  }, [map, eventBus]);

  if (!map) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Map not found</p>
      </div>
    );
  }

  const { imageSize } = map;

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      if (currentTool !== 'move') {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));

      // Zoom to mouse position
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left) / viewport.zoom;
        const mouseY = (e.clientY - rect.top) / viewport.zoom;

        const newPosition: Position = {
          x: viewport.position.x - mouseX * (newZoom - viewport.zoom),
          y: viewport.position.y - mouseY * (newZoom - viewport.zoom),
        };

        setViewport({ zoom: newZoom, position: newPosition });
        eventBus.emit('viewport:change', {
          zoom: newZoom,
          position: newPosition,
        });
      }
    },
    [viewport, currentTool, eventBus]
  );

  // Handle pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (currentTool === 'move' && e.button === 0) {
        setIsPanning(true);
        setPanStart({
          x: e.clientX - viewport.position.x,
          y: e.clientY - viewport.position.y,
        });
      }
    },
    [currentTool, viewport.position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning && currentTool === 'move') {
        const newPosition: Position = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        };
        setViewport((prev) => ({ ...prev, position: newPosition }));
        eventBus.emit('viewport:change', {
          zoom: viewport.zoom,
          position: newPosition,
        });
      }
    },
    [isPanning, panStart, currentTool, viewport.zoom, eventBus]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Update container dimensions
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div ref={setDropRef} className="w-full h-full">
        <svg
          ref={svgRef}
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
        width={containerSize.width || '100%'}
        height={containerSize.height || '100%'}
        style={{
          transform: `translate(${viewport.position.x}px, ${viewport.position.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="map-canvas"
      >
        <BackgroundLayer imageUrl={map.imageUrl} size={imageSize} />
        <GridLayer size={imageSize} />
        <ModulesLayer mapId={mapId} />
      </svg>
      </div>
    </div>
  );
};

