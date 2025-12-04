/**
 * Map Canvas
 * Main SVG canvas container replacing Konva Stage
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import { BackgroundLayer } from './BackgroundLayer';
import { GridLayer } from './GridLayer';
import { ModulesLayer } from './ModulesLayer';
import { Rulers } from '../Rulers/Rulers';
import { useMapService } from '../../hooks/useMapService';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useMapCommands } from '../../hooks/useMapCommands';
import { useViewportService } from '../../hooks/useViewportService';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
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
  const viewportService = useViewportService();
  const editorService = useEditorService();

  // Track drag position for drop handling
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Make canvas a drop target
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'map-editor-canvas',
  });

  // Handle drop events
  useDndMonitor({
    onDragMove: (event) => {
      if (event.activatorEvent && event.activatorEvent instanceof MouseEvent) {
        setDragPosition({ x: event.activatorEvent.clientX, y: event.activatorEvent.clientY });
      }
    },
    onDragEnd: (event) => {
      if (event.over?.id === 'map-editor-canvas' && event.active.data.current?.template) {
        const template = event.active.data.current.template as ModuleTemplate;
        const map = mapService.getMap(mapId);
        
        if (!map || !dragPosition || !svgRef.current) {
          setDragPosition(null);
          return;
        }

        // Get SVG bounding rect
        const svgRect = svgRef.current.getBoundingClientRect();
        const currentViewport = viewportService.getViewport();
        
        // Convert client coordinates to SVG coordinates
        // Account for viewport transform (position and zoom)
        const svgRelativeX = dragPosition.x - svgRect.left;
        const svgRelativeY = dragPosition.y - svgRect.top;
        
        // Convert to canvas coordinates (accounting for viewport transform)
        // The SVG has a transform: translate(viewport.position) scale(viewport.zoom)
        // So we need to reverse that: (svgPos - viewport.position) / viewport.zoom
        const canvasX = (svgRelativeX - currentViewport.position.x) / currentViewport.zoom;
        const canvasY = (svgRelativeY - currentViewport.position.y) / currentViewport.zoom;
        
        // Snap to grid if enabled
        const gridSize = editorService.getGridSize();
        const snapToGrid = editorService.isSnapToGrid();
        const finalX = snapToGrid ? Math.round(canvasX / gridSize) * gridSize : canvasX;
        const finalY = snapToGrid ? Math.round(canvasY / gridSize) * gridSize : canvasY;

        const newModule: AnyModule = {
          id: `module-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: template.type,
          position: { x: finalX, y: finalY },
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
        setDragPosition(null);
      } else {
        setDragPosition(null);
      }
    },
  });

  const map = mapService.getMap(mapId);

  // Initialize viewport from service
  useEffect(() => {
    if (!map) return;
    const initialViewport = viewportService.getViewport();
    setViewport(initialViewport);
  }, [map, viewportService]);

  // Listen to viewport changes
  useEffect(() => {
    if (!map) return;

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
      const delta = e.deltaY > 0 ? 1 / EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR : EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR;
      const currentViewport = viewportService.getViewport();
      const newZoom = Math.max(
        EDITOR_CONSTANTS.MIN_ZOOM,
        Math.min(EDITOR_CONSTANTS.MAX_ZOOM, currentViewport.zoom * delta)
      );

      // Zoom to mouse position
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left) / currentViewport.zoom;
        const mouseY = (e.clientY - rect.top) / currentViewport.zoom;

        const newPosition: Position = {
          x: currentViewport.position.x - mouseX * (newZoom - currentViewport.zoom),
          y: currentViewport.position.y - mouseY * (newZoom - currentViewport.zoom),
        };

        viewportService.setViewport({ zoom: newZoom, position: newPosition });
      }
    },
    [currentTool, viewportService]
  );

  // Handle pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (currentTool === 'move' && e.button === 0) {
        setIsPanning(true);
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const currentViewport = viewportService.getViewport();
          // Calculate pan start: convert mouse position to canvas coordinates (like handleWheel)
          // The viewport position is in canvas coordinates, so we need to divide by zoom
          const mouseX = (e.clientX - rect.left) / currentViewport.zoom;
          const mouseY = (e.clientY - rect.top) / currentViewport.zoom;
          setPanStart({
            x: mouseX - currentViewport.position.x,
            y: mouseY - currentViewport.position.y,
          });
        }
      }
    },
    [currentTool, viewportService]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning && currentTool === 'move') {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const currentViewport = viewportService.getViewport();
          // Convert mouse position to canvas coordinates (like handleWheel)
          // Then calculate new position based on the pan start offset
          const mouseX = (e.clientX - rect.left) / currentViewport.zoom;
          const mouseY = (e.clientY - rect.top) / currentViewport.zoom;
          const newPosition: Position = {
            x: mouseX - panStart.x,
            y: mouseY - panStart.y,
          };
          viewportService.setViewport({ position: newPosition });
        }
      }
    },
    [isPanning, panStart, currentTool, viewportService]
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

  const showRulers = editorService.areRulersVisible();
  const rulerSize = 24; // Height for horizontal, width for vertical

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 relative ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      {/* Rulers */}
      {showRulers && <Rulers containerSize={containerSize} />}

      <div
        ref={setDropRef}
        className="w-full h-full"
        style={{
          paddingTop: showRulers ? `${rulerSize}px` : '0',
          paddingLeft: showRulers ? `${rulerSize}px` : '0',
        }}
      >
        <svg
          ref={svgRef}
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
        width={containerSize.width ? containerSize.width - (showRulers ? rulerSize : 0) : '100%'}
        height={containerSize.height ? containerSize.height - (showRulers ? rulerSize : 0) : '100%'}
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

