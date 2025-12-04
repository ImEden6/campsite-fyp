import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Group, Rect, Circle, Text, Line } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { AnyModule, ModuleType } from '@/types';
import { useMapStore, useEditorStore } from '@/stores';
import TransformHandles from './TransformHandles';
import RotationHandle from './RotationHandle';
import { 
  validateBoundaryConstraints, 
  clampToBoundaries,
  validateSize,
  enforceMinimumSize,
  recoverModuleState 
} from '@/utils/validationUtils';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';
import { rafThrottle, performanceMonitor } from '@/utils/performanceUtils';

interface ModuleRendererProps {
  module: AnyModule;
  isSelected: boolean;
  hasValidationErrors?: boolean;
  onSelect: () => void;
}

// Helper functions defined outside component to avoid re-creation
const getModuleColor = (type: ModuleType): string => {
  const colorMap = {
    campsite: '#3B82F6',
    toilet: '#8B5CF6',
    storage: '#F59E0B',
    building: '#10B981',
    parking: '#6B7280',
    road: '#4B5563',
    water_source: '#06B6D4',
    electricity: '#F59E0B',
    waste_disposal: '#EF4444',
    recreation: '#10B981',
    custom: '#6366F1',
  };
  return colorMap[type] || '#6B7280';
};

const getModuleShape = (type: ModuleType) => {
  switch (type) {
    case 'campsite':
      return 'rectangle';
    case 'toilet':
    case 'building':
    case 'storage':
      return 'rectangle';
    case 'parking':
      return 'rectangle';
    case 'road':
      return 'path';
    case 'water_source':
    case 'electricity':
      return 'circle';
    case 'waste_disposal':
      return 'circle';
    case 'recreation':
      return 'rounded-rectangle';
    default:
      return 'rectangle';
  }
};

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ module, isSelected, hasValidationErrors = false, onSelect }) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { updateModule, selectedMapId, maps } = useMapStore();
  const { editor, pushHistory } = useEditorStore();

  // Memoize module color to avoid recalculation
  const moduleColor = useMemo(() => getModuleColor(module.type), [module.type]);
  
  // Memoize module shape type
  const moduleShape = useMemo(() => getModuleShape(module.type), [module.type]);

  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    if (editor.currentTool !== 'select') return;

    // handle position updates manually to avoid compounding with Group position
    e.target.stopDrag();

    setIsDragging(true);
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert screen coordinates to canvas coordinates
    const canvasPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
    
    // Calculate offset in canvas coordinates
    setDragOffset({
      x: canvasPos.x - module.position.x,
      y: canvasPos.y - module.position.y,
    });
    
    // Capture state before drag operation
    if (selectedMapId) {
      const currentMap = maps.find(m => m.id === selectedMapId);
      if (currentMap) {
        pushHistory(currentMap, {
          type: 'module_move',
          moduleIds: [module.id],
        });
      }
    }
  };

  // Throttle drag move using RAF for 60 FPS performance
  // Note: This is called manually via mouse move listeners, not by Konva's drag system
  const handleDragMove = useMemo(() =>
    rafThrottle((e: KonvaEventObject<MouseEvent>) => {
      if (!isDragging || editor.currentTool !== 'select') return;

      const end = performanceMonitor.start('module-drag');

      try {
        // Get stage from the event or from groupRef
        const stage = e.target.getStage() || groupRef.current?.getStage();
        const pos = stage?.getPointerPosition();
        if (!stage || !pos) return;

        // Account for viewport zoom and position
        let newX = (pos.x - stage.x()) / stage.scaleX() - dragOffset.x;
        let newY = (pos.y - stage.y()) / stage.scaleY() - dragOffset.y;

        // Snap to grid if enabled
        if (editor.snapToGrid) {
          newX = Math.round(newX / editor.gridSize) * editor.gridSize;
          newY = Math.round(newY / editor.gridSize) * editor.gridSize;
        }

        let newPosition = { x: newX, y: newY };

        // Validate boundary constraints if map bounds are available
        const currentMap = maps.find(m => m.id === selectedMapId);
        if (currentMap && currentMap.bounds) {
          const boundaryValidation = validateBoundaryConstraints(
            newPosition,
            module.size,
            currentMap.bounds
          );

          if (!boundaryValidation.isValid) {
            // Clamp position to boundaries
            newPosition = clampToBoundaries(newPosition, module.size, currentMap.bounds);
            
            errorLogger.warn(
              ErrorCategory.VALIDATION,
              'Module position clamped to map boundaries',
              { 
                moduleId: module.id,
                attemptedPosition: { x: newX, y: newY },
                clampedPosition: newPosition,
                errors: boundaryValidation.errors 
              }
            );
          }
        }

        const updatedModule = {
          ...module,
          position: newPosition,
          updatedAt: new Date(),
        };

        if (selectedMapId) {
          updateModule(selectedMapId, updatedModule);
        }
      } catch (error) {
        errorLogger.error(
          ErrorCategory.TRANSFORM,
          'Error during module drag',
          { moduleId: module.id },
          error as Error
        );
      } finally {
        end();
      }
    }),
    [isDragging, editor.currentTool, editor.snapToGrid, editor.gridSize, dragOffset, module, selectedMapId, maps, updateModule]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global mouse move and mouse up listeners when dragging
  // This allows for handle drag manually without Konva's automatic Group movement
  useEffect(() => {
    if (!isDragging) return;

    const stage = groupRef.current?.getStage();
    if (!stage) return;

    stage.on('mousemove', handleDragMove);
    stage.on('mouseup', handleDragEnd);
    stage.on('mouseleave', handleDragEnd);

    return () => {
      stage.off('mousemove', handleDragMove);
      stage.off('mouseup', handleDragEnd);
      stage.off('mouseleave', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
  };

  const handleDoubleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    // Select the module to open properties panel
    onSelect();
  };

  // Memoize shape rendering to avoid unnecessary recalculations
  const renderModuleShape = useMemo(() => {
    const { x, y } = module.position;
    const { width, height } = module.size;

    const baseProps = {
      x,
      y,
      width,
      height,
      fill: moduleColor,
      stroke: hasValidationErrors ? '#EF4444' : (isSelected ? '#0EA5E9' : moduleColor),
      strokeWidth: hasValidationErrors ? 3 : (isSelected ? 2 : 1),
      opacity: module.visible ? (isDragging ? 0.6 : 0.8) : 0.4,
      shadowColor: isDragging ? 'rgba(14, 165, 233, 0.4)' : 'rgba(0, 0, 0, 0.2)',
      shadowBlur: isDragging ? 15 : 5,
      shadowOffset: { x: isDragging ? 0 : 2, y: isDragging ? 0 : 2 },
      // Enable caching for better performance
      perfectDrawEnabled: false,
    };

    switch (moduleShape) {
      case 'circle':
        return (
          <Circle
            {...baseProps}
            x={x + width / 2}
            y={y + height / 2}
            radius={Math.min(width, height) / 2}
          />
        );

      case 'rounded-rectangle':
        return (
          <Rect
            {...baseProps}
            cornerRadius={8}
          />
        );

      case 'path':
        // For roads, create a path-like shape
        return (
          <Rect
            {...baseProps}
            cornerRadius={height / 4}
          />
        );

      default:
        return <Rect {...baseProps} />;
    }
  }, [module.position, module.size, module.visible, moduleColor, moduleShape, isSelected, hasValidationErrors, isDragging]);

  // Memoize icon rendering
  const renderModuleIcon = useMemo(() => {
    const { x, y } = module.position;
    const { width, height } = module.size;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Simple icon representations using shapes
    switch (module.type) {
      case 'campsite':
        return (
          <Group>
            {/* Tent shape */}
            <Line
              points={[centerX - 15, centerY + 10, centerX, centerY - 10, centerX + 15, centerY + 10]}
              stroke="white"
              strokeWidth={2}
              closed={true}
              fill="rgba(255, 255, 255, 0.8)"
            />
            <Line
              points={[centerX, centerY - 10, centerX, centerY + 10]}
              stroke="white"
              strokeWidth={1}
            />
          </Group>
        );

      case 'toilet':
        return (
          <Group>
            {/* Simple building icon */}
            <Rect
              x={centerX - 8}
              y={centerY - 8}
              width={16}
              height={16}
              fill="white"
              stroke="white"
              strokeWidth={1}
            />
            <Rect
              x={centerX - 3}
              y={centerY - 3}
              width={6}
              height={6}
              fill="rgba(0, 0, 0, 0.3)"
            />
          </Group>
        );

      case 'water_source':
        return (
          <Group>
            {/* Water drop */}
            <Circle
              x={centerX}
              y={centerY + 3}
              radius={6}
              fill="white"
            />
            <Circle
              x={centerX}
              y={centerY - 3}
              radius={3}
              fill="white"
            />
          </Group>
        );

      case 'electricity':
        return (
          <Group>
            {/* Lightning bolt */}
            <Line
              points={[centerX - 5, centerY - 8, centerX + 2, centerY, centerX - 2, centerY, centerX + 5, centerY + 8]}
              stroke="white"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          </Group>
        );

      case 'parking':
        return (
          <Group>
            {/* Car icon */}
            <Rect
              x={centerX - 10}
              y={centerY - 4}
              width={20}
              height={8}
              fill="white"
              cornerRadius={2}
            />
            <Circle x={centerX - 6} y={centerY + 4} radius={2} fill="rgba(0, 0, 0, 0.3)" />
            <Circle x={centerX + 6} y={centerY + 4} radius={2} fill="rgba(0, 0, 0, 0.3)" />
          </Group>
        );

      case 'recreation':
        return (
          <Group>
            {/* Tree icon */}
            <Circle
              x={centerX}
              y={centerY - 3}
              radius={6}
              fill="white"
            />
            <Line
              points={[centerX, centerY + 3, centerX, centerY + 10]}
              stroke="white"
              strokeWidth={2}
            />
          </Group>
        );

      default:
        return (
          <Circle
            x={centerX}
            y={centerY}
            radius={4}
            fill="white"
            perfectDrawEnabled={false}
          />
        );
    }
  }, [module.type, module.position, module.size]);

  // Memoize label rendering
  const renderModuleLabel = useMemo(() => {
    const { x, y } = module.position;
    const { width, height } = module.size;
    const name = module.metadata.name || `${module.type} ${module.id.slice(0, 4)}`;
    const isDark = document.documentElement.classList.contains('dark');

    return (
      <Text
        x={x}
        y={y + height + 5}
        width={width}
        text={name}
        fontSize={12}
        fontFamily="Inter"
        fontStyle="bold"
        fill={isDark ? '#F3F4F6' : '#111827'}
        align="center"
        ellipsis={true}
        wrap="none"
        perfectDrawEnabled={false}
        shadowColor={isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
        shadowBlur={3}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
    );
  }, [module.position, module.size, module.metadata.name, module.type, module.id]);

  const moduleId = module.id;

  const handleResizeStart = useCallback(() => {
    // Capture state before resize operation
    if (selectedMapId) {
      const currentMap = maps.find(m => m.id === selectedMapId);
      if (currentMap) {
        pushHistory(currentMap, {
          type: 'module_resize',
          moduleIds: [moduleId],
        });
      }
    }
  }, [selectedMapId, maps, pushHistory, moduleId]);

  // Throttle resize using RAF for smooth performance
  const handleResize = useMemo(() =>
    rafThrottle((newBounds: { position: { x: number; y: number }; size: { width: number; height: number } }) => {
      const end = performanceMonitor.start('module-resize');

      try {
        const validatedBounds = { ...newBounds };

        // Validate size
        const sizeValidation = validateSize(newBounds.size);
        if (!sizeValidation.isValid) {
          validatedBounds.size = enforceMinimumSize(newBounds.size);
          
          errorLogger.warn(
            ErrorCategory.VALIDATION,
            'Resize resulted in invalid size, enforcing minimum constraints',
            { 
              moduleId: module.id,
              attemptedSize: newBounds.size,
              enforcedSize: validatedBounds.size,
              errors: sizeValidation.errors 
            }
          );
        }

        // Validate boundary constraints if map bounds are available
        const currentMap = maps.find(m => m.id === selectedMapId);
        if (currentMap && currentMap.bounds) {
          const boundaryValidation = validateBoundaryConstraints(
            validatedBounds.position,
            validatedBounds.size,
            currentMap.bounds
          );

          if (!boundaryValidation.isValid) {
            // Clamp position to boundaries
            validatedBounds.position = clampToBoundaries(
              validatedBounds.position,
              validatedBounds.size,
              currentMap.bounds
            );
            
            errorLogger.warn(
              ErrorCategory.VALIDATION,
              'Module position clamped to map boundaries during resize',
              { 
                moduleId: module.id,
                attemptedPosition: newBounds.position,
                clampedPosition: validatedBounds.position,
                errors: boundaryValidation.errors 
              }
            );
          }
        }

        const updatedModule = {
          ...module,
          position: validatedBounds.position,
          size: validatedBounds.size,
          updatedAt: new Date(),
        };

        if (selectedMapId) {
          updateModule(selectedMapId, updatedModule);
        }
      } catch (error) {
        errorLogger.error(
          ErrorCategory.TRANSFORM,
          'Error during module resize',
          { moduleId: module.id, newBounds },
          error as Error
        );
        
        // Attempt to recover module state
        const currentMap = maps.find(m => m.id === selectedMapId);
        const recoveredModule = recoverModuleState(module, currentMap?.bounds);
        
        if (selectedMapId) {
          updateModule(selectedMapId, recoveredModule);
        }
      } finally {
        end();
      }
    }),
    [module, selectedMapId, maps, updateModule]
  );

  const handleResizeEnd = useCallback(() => {
    // Resize operation complete
  }, []);

  const handleRotateStart = useCallback(() => {
    // Capture state before rotation operation
    if (selectedMapId) {
      const currentMap = maps.find(m => m.id === selectedMapId);
      if (currentMap) {
        pushHistory(currentMap, {
          type: 'module_rotate',
          moduleIds: [moduleId],
        });
      }
    }
  }, [selectedMapId, maps, pushHistory, moduleId]);

  // Throttle rotation using RAF
  const handleRotate = useMemo(() =>
    rafThrottle((newRotation: number) => {
      const end = performanceMonitor.start('module-rotate');

      try {
        const updatedModule = {
          ...module,
          rotation: newRotation,
          updatedAt: new Date(),
        };

        if (selectedMapId) {
          updateModule(selectedMapId, updatedModule);
        }
      } finally {
        end();
      }
    }),
    [module, selectedMapId, updateModule]
  );

  const handleRotateEnd = useCallback(() => {
    // Rotation operation complete
  }, []);

  // Memoize selection handles to prevent unnecessary re-renders
  const renderSelectionHandles = useMemo(() => {
    if (!isSelected) return null;

    const { x, y } = module.position;
    const { width, height } = module.size;

    return (
      <TransformHandles
        bounds={{ x, y, width, height }}
        rotation={module.rotation || 0}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        snapToGrid={editor.snapToGrid}
        gridSize={editor.gridSize}
        minSize={{ width: 20, height: 20 }}
      />
    );
    }, [isSelected, module.position, module.size, module.rotation, editor.snapToGrid, editor.gridSize, handleResize, handleResizeStart, handleResizeEnd]);

  // Memoize rotation handle
  const renderRotationHandle = useMemo(() => {
    if (!isSelected) return null;

    const { x, y } = module.position;
    const { width, height } = module.size;

    return (
      <RotationHandle
        bounds={{ x, y, width, height }}
        currentRotation={module.rotation || 0}
        onRotateStart={handleRotateStart}
        onRotate={handleRotate}
        onRotateEnd={handleRotateEnd}
        snapAngle={15}
      />
    );

  }, [isSelected, module.position, module.size, module.rotation, handleRotate, handleRotateStart, handleRotateEnd]);

  return (
    <Group
      ref={groupRef}
      draggable={editor.currentTool === 'select' && !module.locked}
      onDragStart={handleDragStart}
      // Note: onDragMove and onDragEnd are handled manually via mouse event listeners
      // to prevent Konva's automatic Group movement from interfering
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container && editor.currentTool === 'select' && !module.locked) {
          container.style.cursor = 'move';
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container && !isDragging) {
          container.style.cursor = 'default';
        }
      }}
      // Performance optimizations: cache when not dragging, enable hit graph for better hit testing
      cache={!isDragging}
      hitGraphEnabled={true}
    >
      {/* Module shape */}
      {renderModuleShape}

      {/* Module icon */}
      {renderModuleIcon}

      {/* Module label */}
      {renderModuleLabel}

      {/* Selection handles */}
      {renderSelectionHandles}

      {/* Rotation handle */}
      {renderRotationHandle}

      {/* Lock indicator */}
      {module.locked && (
        <Circle
          x={module.position.x + module.size.width - 8}
          y={module.position.y + 8}
          radius={6}
          fill="rgba(239, 68, 68, 0.9)"
          stroke="white"
          strokeWidth={1}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Validation error indicator */}
      {hasValidationErrors && (
        <Circle
          x={module.position.x + module.size.width - 8}
          y={module.locked ? 20 : 8}
          radius={6}
          fill="rgba(239, 68, 68, 1)"
          stroke="white"
          strokeWidth={2}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ModuleRenderer, (prevProps, nextProps) => {
  // Only re-render if module data or selection state changes
  return (
    prevProps.module.id === nextProps.module.id &&
    prevProps.module.position.x === nextProps.module.position.x &&
    prevProps.module.position.y === nextProps.module.position.y &&
    prevProps.module.size.width === nextProps.module.size.width &&
    prevProps.module.size.height === nextProps.module.size.height &&
    prevProps.module.rotation === nextProps.module.rotation &&
    prevProps.module.visible === nextProps.module.visible &&
    prevProps.module.locked === nextProps.module.locked &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasValidationErrors === nextProps.hasValidationErrors &&
    prevProps.module.metadata.name === nextProps.module.metadata.name
  );
});