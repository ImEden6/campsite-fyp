/**
 * Map Canvas
 * Main Konva Stage container for rendering map layers
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Stage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import { BackgroundLayer } from './BackgroundLayer';
import { GridLayer } from './GridLayer';
import { ModulesLayer } from './ModulesLayer';
import { AccessibilityLayer } from './AccessibilityLayer';
import { DragPreviewLayer } from './DragPreviewLayer';
import { Rulers } from '../Rulers/Rulers';
import { useMapService } from '../../hooks/useMapService';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapCommands } from '../../hooks/useMapCommands';
import { useViewportService } from '../../hooks/useViewportService';
import { useKonvaStage } from '../../hooks/useKonvaStage';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
import type { Position, ModuleTemplate, AnyModule } from '@/types';

interface MapCanvasProps {
  mapId: string;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ mapId }) => {
  const {
    stageRef,
    containerRef,
    stageSize,
    screenToCanvas,
  } = useKonvaStage();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [focusedModuleId, setFocusedModuleId] = useState<string | undefined>(undefined);
  // Drag state for preview layer
  const [dragState, setDragState] = useState<Array<{
    module: AnyModule;
    offset: { x: number; y: number };
    currentPosition: { x: number; y: number };
  }>>([]);

  const mapService = useMapService();
  const { currentTool, selection } = useEditorService();
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
        
        if (!map || !dragPosition || !stageRef.current) {
          setDragPosition(null);
          return;
        }

        // Get Stage bounding rect
        const stageRect = stageRef.current.container().getBoundingClientRect();
        
        // Convert client coordinates to screen coordinates relative to stage
        const screenPos = {
          x: dragPosition.x - stageRect.left,
          y: dragPosition.y - stageRect.top,
        };
        
        // Convert to canvas coordinates using Konva coordinate conversion
        const canvasPos = screenToCanvas(screenPos);
        
        // Snap to grid if enabled
        const gridSize = editorService.getGridSize();
        const snapToGrid = editorService.isSnapToGrid();
        const finalX = snapToGrid ? Math.round(canvasPos.x / gridSize) * gridSize : canvasPos.x;
        const finalY = snapToGrid ? Math.round(canvasPos.y / gridSize) * gridSize : canvasPos.y;

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

  // Calculate container size accounting for rulers
  const showRulers = editorService.areRulersVisible();
  const rulerSize = 24; // Height for horizontal, width for vertical
  const containerSize = useMemo(() => ({
    width: Math.max(0, stageSize.width - (showRulers ? rulerSize : 0)),
    height: Math.max(0, stageSize.height - (showRulers ? rulerSize : 0)),
  }), [stageSize.width, stageSize.height, showRulers]);

  // Calculate and set minimum zoom based on grid bounds
  useEffect(() => {
    if (!map || containerSize.width === 0 || containerSize.height === 0) return;

    // Use gridBounds if available, otherwise use imageSize
    const gridSize = map.gridBounds || map.imageSize;

    // Calculate minimum zoom to fit grid in container
    const minZoom = viewportService.calculateMinZoom(gridSize, containerSize);
    viewportService.setMinZoom(minZoom);
  }, [map, containerSize, viewportService]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      if (currentTool !== 'move') {
        e.evt.preventDefault();
        return;
      }

      e.evt.preventDefault();
      const delta = e.evt.deltaY > 0 ? 1 / EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR : EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR;
      const currentViewport = viewportService.getViewport();
      const minZoom = viewportService.getMinZoom();
      const newZoom = Math.max(
        minZoom,
        Math.min(EDITOR_CONSTANTS.MAX_ZOOM, currentViewport.zoom * delta)
      );

      // Zoom to mouse position
      const stage = stageRef.current;
      if (stage) {
        // Get mouse position in canvas coordinates before zoom
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          const canvasPos = screenToCanvas(pointerPos);

          // Calculate new position to keep the same point under the mouse
          const newPosition: Position = {
            x: pointerPos.x - canvasPos.x * newZoom,
            y: pointerPos.y - canvasPos.y * newZoom,
          };

          viewportService.setViewport({ zoom: newZoom, position: newPosition });
        }
      }
    },
    [currentTool, viewportService, stageRef, screenToCanvas]
  );

  // Handle pan
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (currentTool === 'move' && e.evt.button === 0) {
        setIsPanning(true);
        const stage = stageRef.current;
        if (stage) {
          const pointerPos = stage.getPointerPosition();
          if (pointerPos) {
            const currentViewport = viewportService.getViewport();
            const canvasPos = screenToCanvas(pointerPos);
            setPanStart({
              x: canvasPos.x - currentViewport.position.x,
              y: canvasPos.y - currentViewport.position.y,
            });
          }
        }
      }
    },
    [currentTool, viewportService, stageRef, screenToCanvas]
  );

  const handleMouseMove = useCallback(
    (_e: KonvaEventObject<MouseEvent>) => {
      if (isPanning && currentTool === 'move') {
        const stage = stageRef.current;
        if (stage) {
          const pointerPos = stage.getPointerPosition();
          if (pointerPos) {
            const canvasPos = screenToCanvas(pointerPos);
            const newPosition: Position = {
              x: canvasPos.x - panStart.x,
              y: canvasPos.y - panStart.y,
            };
            viewportService.setViewport({ position: newPosition });
          }
        }
      }
    },
    [isPanning, panStart, currentTool, viewportService, stageRef, screenToCanvas]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle pinch zoom
  const handlePinchZoom = useCallback(
    (delta: number, screenCenter: { x: number; y: number }) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Convert screen center to canvas coordinates
      const oldScale = stage.scaleX();
      const newScale = Math.max(
        viewportService.getMinZoom(),
        Math.min(EDITOR_CONSTANTS.MAX_ZOOM, oldScale * delta)
      );

      // Get canvas position from screen center
      const mousePointTo = {
        x: (screenCenter.x - stage.x()) / oldScale,
        y: (screenCenter.y - stage.y()) / oldScale,
      };

      // Update stage transform
      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: screenCenter.x - mousePointTo.x * newScale,
        y: screenCenter.y - mousePointTo.y * newScale,
      });

      stage.batchDraw();

      // Update viewport service
      viewportService.setViewport({
        zoom: newScale,
        position: { x: stage.x(), y: stage.y() },
      });
    },
    [viewportService, stageRef]
  );

  // Touch gesture handlers
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures({
    onPinchZoom: handlePinchZoom,
  });

  // Keyboard navigation for focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Only handle when canvas is focused and no modules are selected
      if (selection.length > 0) {
        // Arrow keys move selected modules (handled by useMapEditorShortcuts)
        return;
      }

      const map = mapService.getMap(mapId);
      if (!map || map.modules.length === 0) return;

      const modules = map.modules;
      const currentFocusIndex = focusedModuleId
        ? modules.findIndex((m) => m.id === focusedModuleId)
        : -1;

      // Arrow key navigation between modules
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        // If no focus, start with first module
        if (currentFocusIndex === -1) {
          setFocusedModuleId(modules[0]?.id);
          return;
        }

        // Calculate next module based on direction
        // Simple implementation: move to nearest module in that direction
        const currentModule = modules[currentFocusIndex];
        if (!currentModule) return;
        
        let nextIndex = currentFocusIndex;

        if (e.key === 'ArrowUp') {
          // Find module above current
          const candidates = modules
            .map((m, idx) => ({ module: m, idx, y: m.position.y }))
            .filter((item) => item.y < currentModule.position.y)
            .sort((a, b) => b.y - a.y); // Closest above
          nextIndex = candidates[0]?.idx ?? currentFocusIndex;
        } else if (e.key === 'ArrowDown') {
          // Find module below current
          const candidates = modules
            .map((m, idx) => ({ module: m, idx, y: m.position.y }))
            .filter((item) => item.y > currentModule.position.y)
            .sort((a, b) => a.y - b.y); // Closest below
          nextIndex = candidates[0]?.idx ?? currentFocusIndex;
        } else if (e.key === 'ArrowLeft') {
          // Find module to the left
          const candidates = modules
            .map((m, idx) => ({ module: m, idx, x: m.position.x }))
            .filter((item) => item.x < currentModule.position.x)
            .sort((a, b) => b.x - a.x); // Closest left
          nextIndex = candidates[0]?.idx ?? currentFocusIndex;
        } else if (e.key === 'ArrowRight') {
          // Find module to the right
          const candidates = modules
            .map((m, idx) => ({ module: m, idx, x: m.position.x }))
            .filter((item) => item.x > currentModule.position.x)
            .sort((a, b) => a.x - b.x); // Closest right
          nextIndex = candidates[0]?.idx ?? currentFocusIndex;
        }

        const nextModule = modules[nextIndex];
        if (nextIndex !== currentFocusIndex && nextModule) {
          setFocusedModuleId(nextModule.id);
        }
      }

      // Enter/Space: Select focused module
      if ((e.key === 'Enter' || e.key === ' ') && focusedModuleId) {
        e.preventDefault();
        editorService.selectModules([focusedModuleId]);
        setFocusedModuleId(undefined);
      }

      // Escape: Clear focus
      if (e.key === 'Escape') {
        setFocusedModuleId(undefined);
        editorService.clearSelection();
      }
    };

    // Only attach listener when canvas container is focused
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [mapId, focusedModuleId, selection, mapService, editorService, containerRef]);

  if (!map) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Map not found</p>
      </div>
    );
  }

  const { imageSize, gridBounds } = map;
  
  // Use gridBounds if available, otherwise fallback to imageSize
  const gridSize = gridBounds || imageSize;

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
        <Stage
          ref={stageRef}
          width={containerSize.width || stageSize.width}
          height={containerSize.height || stageSize.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="map-canvas"
          tabIndex={0}
        >
          <BackgroundLayer imageUrl={map.imageUrl} size={imageSize} />
          <GridLayer size={gridSize} />
          <ModulesLayer 
            mapId={mapId} 
            focusedModuleId={focusedModuleId}
            onDragStateChange={setDragState}
          />
          <DragPreviewLayer draggedModules={dragState} />
        </Stage>
        {/* Accessibility layer for screen readers */}
        <AccessibilityLayer
          modules={map.modules}
          selectedIds={selection}
          focusedModuleId={focusedModuleId}
          onModuleFocus={setFocusedModuleId}
          onModuleSelect={(moduleId, multiSelect) => {
            editorService.selectModules(multiSelect ? [...selection, moduleId] : [moduleId]);
          }}
        />
      </div>
    </div>
  );
};