/**
 * Modules Layer
 * Renders all modules on the map using Konva
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Layer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapService } from '../../hooks/useMapService';
import { useMapCommands } from '../../hooks/useMapCommands';
import type { Position, Size, AnyModule } from '@/types';

interface ModulesLayerProps {
  mapId: string;
  focusedModuleId?: string;
  onDragStateChange?: (dragState: Array<{
    module: AnyModule;
    offset: { x: number; y: number };
    currentPosition: { x: number; y: number };
  }>) => void;
}

export const ModulesLayer: React.FC<ModulesLayerProps> = ({ mapId, focusedModuleId, onDragStateChange }) => {
  const { renderer, eventBus } = useMapEditor();
  const { selection, layerVisibility } = useEditorService();
  const mapService = useMapService();
  const { moveModule, resizeModule, rotateModule } = useMapCommands();

  const modules = mapService.getModules(mapId);
  
  // Track drag state for preview layer
  const dragStateRef = useRef<Array<{
    module: AnyModule;
    offset: { x: number; y: number };
    currentPosition: { x: number; y: number };
  }>>([]);
  
  // Track modules that should animate (user-initiated moves)
  const [modulesToAnimate, setModulesToAnimate] = useState<Set<string>>(new Set());
  const animationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Listen for module:select events
  useEffect(() => {
    const unsubscribe = eventBus.on('module:select', () => {
      // Handle selection via editor service
      // This will be handled by the editor service listener
    });

    return unsubscribe;
  }, [eventBus]);

  // Listen for arrow key moves (user-initiated)
  useEffect(() => {
    const unsubscribe = eventBus.on('module:move-arrow', (_payload) => {
      const selectedIds = selection;
      if (selectedIds.length === 0) return;

      // Mark these modules for animation
      setModulesToAnimate((prev) => {
        const next = new Set(prev);
        selectedIds.forEach((id) => next.add(id));
        return next;
      });

      // Clear animation flag after animation completes
      const timeoutMap = animationTimeoutRef.current;
      selectedIds.forEach((id) => {
        // Clear existing timeout
        const existingTimeout = timeoutMap.get(id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout to clear animation flag
        const timeout = setTimeout(() => {
          setModulesToAnimate((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          timeoutMap.delete(id);
        }, 250); // Slightly longer than animation duration

        timeoutMap.set(id, timeout);
      });
    });

    return () => {
      unsubscribe();
      // Cleanup timeouts - use ref value captured in closure
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timeoutMap = animationTimeoutRef.current;
      timeoutMap.forEach((timeout) => clearTimeout(timeout));
      timeoutMap.clear();
    };
  }, [eventBus, selection]);

  // Filter modules by layer visibility
  const visibleModules = modules.filter(
    (module) => layerVisibility[module.type] !== false
  );

  const handleModuleSelect = (moduleId: string, multiSelect: boolean = false) => {
    eventBus.emit('module:select', { moduleId, multiSelect });
  };

  // Handle drag start
  const handleDragStart = useCallback((moduleId: string, offset: Position) => {
    const draggedModules = selection.includes(moduleId)
      ? modules.filter((m) => selection.includes(m.id))
      : [modules.find((m) => m.id === moduleId)].filter((m): m is AnyModule => m !== undefined);

    if (draggedModules.length === 0) return;

    // Calculate relative offsets for each module
    const primaryModule = draggedModules.find((m) => m.id === moduleId) || draggedModules[0];
    if (!primaryModule) return;
    
    const primaryOffset = offset;

    dragStateRef.current = draggedModules.map((module) => {
      const relativeOffset = {
        x: module.position.x - primaryModule.position.x + primaryOffset.x,
        y: module.position.y - primaryModule.position.y + primaryOffset.y,
      };
      return {
        module,
        offset: relativeOffset,
        currentPosition: module.position,
      };
    });

    onDragStateChange?.(dragStateRef.current);
  }, [selection, modules, onDragStateChange]);

  // Handle drag move
  const handleDragMove = useCallback((moduleId: string, position: Position) => {
    const draggedModules = selection.includes(moduleId)
      ? modules.filter((m) => selection.includes(m.id))
      : [modules.find((m) => m.id === moduleId)].filter((m): m is AnyModule => m !== undefined);

    if (draggedModules.length === 0) return;

    // Update drag state for preview
    const primaryIndex = dragStateRef.current.findIndex((d) => d.module.id === moduleId);
    if (primaryIndex === -1) return;

    const primaryDragState = dragStateRef.current[primaryIndex];
    if (!primaryDragState) return;
    
    const deltaX = position.x - primaryDragState.currentPosition.x;
    const deltaY = position.y - primaryDragState.currentPosition.y;

    // Update all dragged modules' positions in drag state
    dragStateRef.current = dragStateRef.current.map((dragState) => ({
      ...dragState,
      currentPosition: {
        x: dragState.currentPosition.x + deltaX,
        y: dragState.currentPosition.y + deltaY,
      },
    }));

    onDragStateChange?.(dragStateRef.current);

    // Update actual module positions via commands (throttled by RAF in KonvaModuleRenderer)
    draggedModules.forEach((module) => {
      const dragState = dragStateRef.current.find((d) => d.module.id === module.id);
      if (dragState) {
        moveModule(mapId, module.id, dragState.currentPosition, module.position, 'drag-group');
      }
    });
  }, [selection, modules, mapId, moveModule, onDragStateChange]);

  // Handle drag end
  const handleDragEnd = useCallback((_moduleId: string) => {
    // Clear drag state
    dragStateRef.current = [];
    onDragStateChange?.([]);
  }, [onDragStateChange]);

  // Handle transform operations (resize, rotate, move)
  const handleTransform = useCallback(
    (transform: { position?: Position; size?: Size; rotation?: number }) => {
      if (selection.length !== 1) return;

      const moduleId = selection[0];
      if (!moduleId) return;
      
      const module = modules.find((m) => m.id === moduleId);
      if (!module) return;

      if (transform.position) {
        moveModule(mapId, moduleId, transform.position, module.position);
      }
      if (transform.size) {
        resizeModule(mapId, moduleId, transform.size, module.size);
      }
      if (transform.rotation !== undefined) {
        rotateModule(mapId, moduleId, transform.rotation, module.rotation || 0);
      }
    },
    [selection, modules, mapId, moveModule, resizeModule, rotateModule]
  );

  // Handle Layer-level click events for event delegation
  const handleLayerClick = (e: KonvaEventObject<MouseEvent>) => {
    const shape = e.target;
    
    // Check if clicked shape has moduleId attribute
    if (shape.attrs.moduleId) {
      const moduleId = shape.attrs.moduleId;
      const multiSelect = e.evt.shiftKey || false;
      handleModuleSelect(moduleId, multiSelect);
      return;
    }

    // Handle empty space clicks (deselect)
    // If no moduleId attribute, it's empty space
    if (!shape.attrs.moduleId) {
      eventBus.emit('selection:clear', {});
    }
  };

  return (
    <Layer onClick={handleLayerClick} onTap={handleLayerClick}>
      {visibleModules.map((module) => {
        const isSelected = selection.includes(module.id);
        const shouldAnimate = modulesToAnimate.has(module.id);
        const isFocused = focusedModuleId === module.id;

        return (
          <React.Fragment key={module.id}>
            {renderer.renderModule(module, {
              isSelected,
              hasValidationErrors: false, // TODO: Get from validation service
              onSelect: () => handleModuleSelect(module.id, false),
              shouldAnimate,
              isFocused,
              onDragStart: handleDragStart,
              onDragMove: handleDragMove,
              onDragEnd: handleDragEnd,
            })}
          </React.Fragment>
        );
      })}
      {/* Selection handles (for single or multiple modules) */}
      {selection.length > 0 &&
        renderer.renderSelectionHandles(
          visibleModules.filter((m) => selection.includes(m.id)),
          selection.length === 1 ? handleTransform : undefined
        )}
    </Layer>
  );
};

