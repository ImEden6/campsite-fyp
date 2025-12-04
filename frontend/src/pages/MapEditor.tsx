import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Image } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import { 
  Save, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  Move, 
  MousePointer, 
  RotateCw, 
  Square,
  Ruler,
  Loader2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  AlignLeft,
  AlignRight,
  AlignCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useMapStore, useViewportStore, useEditorStore } from '@/stores';
import { useToast } from '@/hooks/useToast';
import { usePerformanceStats } from '@/hooks/usePerformanceMonitor';
import { useMapEditorShortcuts } from '@/hooks/useMapEditorShortcuts';
import { useViewportCulling } from '@/hooks/useViewportCulling';
import { bulkUpdateModules } from '@/services/api';
import { PageLoader } from '@/components/ui/PageLoader';

// Lazy load heavy MapEditor components
const ModuleLibrary = lazy(() => import('@/components/ModuleLibrary'));
const ModuleRenderer = lazy(() => import('@/components/ModuleRenderer'));
const PropertiesPanel = lazy(() => import('@/components/PropertiesPanel'));
const RulerComponent = lazy(() => import('@/components/RulerComponent'));
const SelectionBoundingBox = lazy(() => import('@/components/SelectionBoundingBox'));
const KeyboardShortcutsDialog = lazy(() => import('@/components/accessibility/KeyboardShortcutsDialog'));
const MapGrid = lazy(() => import('@/components/MapGrid').then(m => ({ default: m.MapGrid })));
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';
import { Tooltip } from '@/components/ui/Tooltip';
import { validateModule } from '@/utils/validationUtils';
import { useAnnounce } from '@/hooks/useFocusManagement';
import LiveRegion from '@/components/accessibility/LiveRegion';
import type { ModuleTemplate, AnyModule } from '@/types';

const MapEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const stageRef = useRef<Konva.Stage | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [moduleValidationErrors, setModuleValidationErrors] = useState<Map<string, string[]>>(new Map());
  
  const { maps, selectedMapId, selectMap, addModule, updateModule, updateMap, setMaps, removeModule } = useMapStore();
  const { viewport, setViewport } = useViewportStore();
  const { 
    editor, 
    setEditor, 
    pushHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    copyModules,
    cutModules,
    pasteModules,
    duplicateModules,
    selectModules,
    toggleShortcutsDialog,
  } = useEditorStore();
  const { showToast } = useToast();
  const { announce } = useAnnounce();
  const [announcement, setAnnouncement] = useState<string>('');
  
  // Enable performance monitoring in development
  usePerformanceStats();
  
  // Memoize current map to avoid recalculation on every render
  const currentMap = useMemo(() => maps.find(m => m.id === id), [maps, id]);
  
  // Memoize modules array to prevent unnecessary recalculations in viewport culling
  const modulesArray = useMemo(() => currentMap?.modules || [], [currentMap?.modules]);
  
  // Viewport culling: only render modules visible in viewport for better performance
  // useViewportCulling already uses useMemo internally, so we just pass the memoized array
  const visibleModules = useViewportCulling(
    modulesArray,
    viewport,
    canvasDimensions.width,
    canvasDimensions.height,
    true // Enable culling for performance
  );
  
  // Drop target for module library
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'map-editor-canvas',
  });

  // Track drag position for drop handling
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Monitor drag events
  useDndMonitor({
    onDragMove: (event) => {
      if (event.activatorEvent && event.activatorEvent instanceof MouseEvent) {
        setDragPosition({ x: event.activatorEvent.clientX, y: event.activatorEvent.clientY });
      }
    },
    onDragEnd: (event) => {
      const { active, over } = event;
      if (!over || over.id !== 'map-editor-canvas' || !active.data.current?.template || !stageRef.current || !selectedMapId) {
        setDragPosition(null);
        return;
      }

      const template = active.data.current.template as ModuleTemplate;
      
      if (!dragPosition || !stageRef.current) {
        setDragPosition(null);
        return;
      }
      
      const stage = stageRef.current;
      const stageBox = stage.container().getBoundingClientRect();
      
      // Convert client coordinates to stage-relative coordinates
      // dragPosition is in clientX/clientY (screen coordinates)
      const stageRelativeX = dragPosition.x - stageBox.left;
      const stageRelativeY = dragPosition.y - stageBox.top;
      
      // Convert stage-relative coordinates to canvas coordinates
      // Use the same formula as drag handlers: (pos - stage.position) / stage.scale
      const x = (stageRelativeX - stage.x()) / stage.scaleX();
      const y = (stageRelativeY - stage.y()) / stage.scaleY();
      
      // Snap to grid if enabled
      const finalX = editor.snapToGrid ? Math.round(x / editor.gridSize) * editor.gridSize : x;
      const finalY = editor.snapToGrid ? Math.round(y / editor.gridSize) * editor.gridSize : y;
      
      try {
        // Create new module from template
        const newModule: AnyModule = {
          id: `module-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: template.type,
          position: { x: finalX, y: finalY },
          size: template.defaultSize,
          rotation: 0,
          zIndex: currentMap?.modules.length || 0,
          locked: false,
          visible: true,
          metadata: template.defaultMetadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AnyModule;
        
        // Capture state before adding module
        const currentMapBeforeAdd = maps.find(m => m.id === selectedMapId);
        if (currentMapBeforeAdd) {
          pushHistory(currentMapBeforeAdd, {
            type: 'module_add',
            moduleId: newModule.id,
          });
        }
        
        addModule(selectedMapId, newModule);
        setHasUnsavedChanges(true);
        showToast(`✓ ${template.type} module added`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
      } catch (error) {
        errorLogger.error(
          ErrorCategory.STATE,
          'Failed to add module from drop',
          { templateType: template.type, position: { x: finalX, y: finalY } },
          error as Error
        );
        showToast('Failed to add module', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
      }
      
      setDragPosition(null);
    },
  });
  
  useEffect(() => {
    if (id && selectedMapId !== id) {
      selectMap(id);
      
      // Capture initial state when map is loaded
      const map = maps.find(m => m.id === id);
      if (map) {
        pushHistory(map, {
          type: 'bulk_operation',
          description: 'Initial state',
        });
      }
    }
  }, [id, selectedMapId, selectMap, maps, pushHistory]);
  
  // Keyboard shortcuts handler - extracted to custom hook
  const handleDelete = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) {
      return;
    }

    try {
      const deleteCount = editor.selectedModuleIds.length;
      
      // Capture state before deleting modules
      pushHistory(currentMap, {
        type: 'module_delete',
        moduleIds: editor.selectedModuleIds,
      });
      
      editor.selectedModuleIds.forEach(moduleId => {
        removeModule(selectedMapId, moduleId);
      });
      setEditor({ selectedModuleIds: [] });
      setHasUnsavedChanges(true);
      showToast(`🗑 Deleted ${deleteCount} module${deleteCount > 1 ? 's' : ''}`, 'info', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.STATE,
        'Failed to delete modules',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to delete modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, pushHistory, removeModule, setEditor, showToast]);

  const handleSelectAll = useCallback(() => {
    if (!currentMap) return;
    try {
      setEditor({ selectedModuleIds: currentMap.modules.map(m => m.id) });
    } catch (error) {
      errorLogger.error(
        ErrorCategory.STATE,
        'Failed to select all modules',
        {},
        error as Error
      );
    }
  }, [currentMap, setEditor]);

  const handleToggleGrid = useCallback(() => {
    try {
      const newGridState = !editor.showGrid;
      setEditor({ showGrid: newGridState });
      showToast(`Grid ${newGridState ? 'enabled' : 'disabled'}`, 'info', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.STATE,
        'Failed to toggle grid',
        {},
        error as Error
      );
    }
  }, [editor.showGrid, setEditor, showToast]);

  const handleZoomIn = useCallback(() => {
    try {
      setViewport({ zoom: Math.min(viewport.zoom * EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR, EDITOR_CONSTANTS.MAX_ZOOM) });
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to zoom in',
        { currentZoom: viewport.zoom },
        error as Error
      );
    }
  }, [viewport.zoom, setViewport]);

  const handleZoomOut = useCallback(() => {
    try {
      setViewport({ zoom: Math.max(viewport.zoom / EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR, EDITOR_CONSTANTS.MIN_ZOOM) });
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to zoom out',
        { currentZoom: viewport.zoom },
        error as Error
      );
    }
  }, [viewport.zoom, setViewport]);

  const handleZoomSliderChange = useCallback((value: number) => {
    try {
      const clampedZoom = Math.max(EDITOR_CONSTANTS.MIN_ZOOM, Math.min(EDITOR_CONSTANTS.MAX_ZOOM, value));
      setViewport({ zoom: clampedZoom });
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to change zoom via slider',
        { value },
        error as Error
      );
    }
  }, [setViewport]);

  const handleFitToScreen = useCallback(() => {
    if (!currentMap || !canvasContainerRef.current) return;
    
    try {
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const mapWidth = currentMap.imageSize.width;
      const mapHeight = currentMap.imageSize.height;
      
      const scaleX = containerRect.width / mapWidth;
      const scaleY = containerRect.height / mapHeight;
      const newZoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
      
      const clampedZoom = Math.max(EDITOR_CONSTANTS.MIN_ZOOM, Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newZoom));
      
      setViewport({
        zoom: clampedZoom,
        position: {
          x: (containerRect.width - mapWidth * clampedZoom) / 2,
          y: (containerRect.height - mapHeight * clampedZoom) / 2,
        },
      });
      
      showToast('Fitted to screen', 'success', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to fit to screen',
        {},
        error as Error
      );
      showToast('Failed to fit to screen', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, setViewport, showToast]);

  const handleZoomToSelection = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0 || !canvasContainerRef.current) {
      showToast('No selection to zoom to', 'warning', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
      return;
    }
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      if (selectedModules.length === 0) return;
      
      // Calculate bounding box of selected modules
      const bounds = selectedModules.reduce(
        (acc, module) => {
          const minX = Math.min(acc.minX, module.position.x);
          const minY = Math.min(acc.minY, module.position.y);
          const maxX = Math.max(acc.maxX, module.position.x + module.size.width);
          const maxY = Math.max(acc.maxY, module.position.y + module.size.height);
          return { minX, minY, maxX, maxY };
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );
      
      const selectionWidth = bounds.maxX - bounds.minX;
      const selectionHeight = bounds.maxY - bounds.minY;
      
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const scaleX = containerRect.width / selectionWidth;
      const scaleY = containerRect.height / selectionHeight;
      const newZoom = Math.min(scaleX, scaleY) * 0.8; // 80% to add padding
      
      const clampedZoom = Math.max(EDITOR_CONSTANTS.MIN_ZOOM, Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newZoom));
      
      // Center the selection
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      setViewport({
        zoom: clampedZoom,
        position: {
          x: containerRect.width / 2 - centerX * clampedZoom,
          y: containerRect.height / 2 - centerY * clampedZoom,
        },
      });
      
      showToast(`Zoomed to ${selectedModules.length} selected module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to zoom to selection',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to zoom to selection', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, setViewport, showToast]);

  // Bulk operations handlers
  const handleBulkLock = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) return;
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      pushHistory(currentMap, {
        type: 'bulk_operation',
        description: `Lock ${selectedModules.length} module(s)`,
      });
      
      selectedModules.forEach(module => {
        updateModule(selectedMapId, {
          ...module,
          locked: true,
          updatedAt: new Date(),
        });
      });
      
      setHasUnsavedChanges(true);
      showToast(`🔒 Locked ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.STATE,
        'Failed to lock modules',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to lock modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, pushHistory, updateModule, showToast]);

  const handleBulkUnlock = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) return;
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      pushHistory(currentMap, {
        type: 'bulk_operation',
        description: `Unlock ${selectedModules.length} module(s)`,
      });
      
      selectedModules.forEach(module => {
        updateModule(selectedMapId, {
          ...module,
          locked: false,
          updatedAt: new Date(),
        });
      });
      
      setHasUnsavedChanges(true);
      showToast(`🔓 Unlocked ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.STATE,
        'Failed to unlock modules',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to unlock modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, pushHistory, updateModule, showToast]);

  const handleBulkVisibility = useCallback((visible: boolean) => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) return;
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      pushHistory(currentMap, {
        type: 'bulk_operation',
        description: `${visible ? 'Show' : 'Hide'} ${selectedModules.length} module(s)`,
      });
      
      selectedModules.forEach(module => {
        updateModule(selectedMapId, {
          ...module,
          visible,
          updatedAt: new Date(),
        });
      });
      
      setHasUnsavedChanges(true);
      showToast(`${visible ? '👁️ Shown' : '👁️‍🗨️ Hidden'} ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.STATE,
        'Failed to change module visibility',
        { moduleIds: editor.selectedModuleIds, visible },
        error as Error
      );
      showToast('Failed to change visibility', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, pushHistory, updateModule, showToast]);

  const handleAlignModules = useCallback((alignment: 'left' | 'right' | 'center' | 'top' | 'bottom') => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length < 2) {
      showToast('Select at least 2 modules to align', 'warning', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
      return;
    }
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      // Calculate alignment target
      let targetValue = 0;
      
      if (alignment === 'left') {
        targetValue = Math.min(...selectedModules.map(m => m.position.x));
      } else if (alignment === 'right') {
        targetValue = Math.max(...selectedModules.map(m => m.position.x + m.size.width));
      } else if (alignment === 'center') {
        const left = Math.min(...selectedModules.map(m => m.position.x));
        const right = Math.max(...selectedModules.map(m => m.position.x + m.size.width));
        targetValue = (left + right) / 2;
      } else if (alignment === 'top') {
        targetValue = Math.min(...selectedModules.map(m => m.position.y));
      } else if (alignment === 'bottom') {
        targetValue = Math.max(...selectedModules.map(m => m.position.y + m.size.height));
      }
      
      pushHistory(currentMap, {
        type: 'bulk_operation',
        description: `Align ${selectedModules.length} module(s) ${alignment}`,
      });
      
      selectedModules.forEach(module => {
        const newPosition = { ...module.position };
        
        if (alignment === 'left') {
          newPosition.x = targetValue;
        } else if (alignment === 'right') {
          newPosition.x = targetValue - module.size.width;
        } else if (alignment === 'center') {
          newPosition.x = targetValue - module.size.width / 2;
        } else if (alignment === 'top') {
          newPosition.y = targetValue;
        } else if (alignment === 'bottom') {
          newPosition.y = targetValue - module.size.height;
        }
        
        updateModule(selectedMapId, {
          ...module,
          position: newPosition,
          updatedAt: new Date(),
        });
      });
      
      setHasUnsavedChanges(true);
      showToast(`↔️ Aligned ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''} ${alignment}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to align modules',
        { moduleIds: editor.selectedModuleIds, alignment },
        error as Error
      );
      showToast('Failed to align modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, pushHistory, updateModule, showToast]);

  const handleSave = useCallback(async () => {
    if (!currentMap || !selectedMapId) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Validate all modules before saving
      const validationErrors = new Map<string, string[]>();
      currentMap.modules.forEach(module => {
        const validation = validateModule(module, currentMap.bounds);
        if (!validation.isValid && validation.errors.length > 0) {
          validationErrors.set(module.id, validation.errors.map(e => e.code));
        }
      });
      
      if (validationErrors.size > 0) {
        setModuleValidationErrors(validationErrors);
        const errorCount = validationErrors.size;
        showToast(`⚠️ Cannot save: ${errorCount} module${errorCount > 1 ? 's have' : ' has'} validation errors`, 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
        setIsSaving(false);
        return;
      }
      
      setModuleValidationErrors(new Map());
      
      // Save map layout to backend
      await updateMap(selectedMapId, {
        id: selectedMapId,
        name: currentMap.name,
        description: currentMap.description,
        metadata: currentMap.metadata,
      });
      
      // Save all modules
      const moduleUpdates = currentMap.modules.map(module => ({
        id: module.id,
        position: module.position,
        size: module.size,
        rotation: module.rotation,
        metadata: module.metadata,
        locked: module.locked,
        visible: module.visible,
      }));
      
      await bulkUpdateModules({
        mapId: selectedMapId,
        modules: moduleUpdates,
      });
      
      setHasUnsavedChanges(false);
      setSaveError(null);
      showToast('✓ Map saved successfully', 'success', EDITOR_CONSTANTS.TOAST_DURATION.LONG);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.NETWORK,
        'Failed to save map',
        { mapId: selectedMapId, moduleCount: currentMap.modules.length },
        error as Error
      );
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveError(errorMessage);
      showToast(`✗ Failed to save map: ${errorMessage}. Click Retry to try again.`, 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    } finally {
      setIsSaving(false);
    }
  }, [currentMap, selectedMapId, updateMap, showToast]);

  // Validate modules when they change
  useEffect(() => {
    if (!currentMap) return;
    
    const validationErrors = new Map<string, string[]>();
    currentMap.modules.forEach(module => {
      const validation = validateModule(module, currentMap.bounds);
      if (!validation.isValid && validation.errors.length > 0) {
        validationErrors.set(module.id, validation.errors.map(e => e.code));
      }
    });
    
    setModuleValidationErrors(validationErrors);
  }, [currentMap]);
  
  const handleUndo = useCallback(() => {
    if (!canUndo()) {
      showToast('Nothing to undo', 'warning', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
      return;
    }
    
    try {
      const previousState = undo();
      if (previousState && selectedMapId) {
        // Restore the previous map state
        const { maps } = useMapStore.getState();
        const updatedMaps = maps.map(map => 
          map.id === selectedMapId ? previousState : map
        );
        setMaps(updatedMaps);
        setHasUnsavedChanges(true);
        showToast('↶ Undo successful', 'info', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
      }
    } catch (error) {
      errorLogger.error(
        ErrorCategory.HISTORY,
        'Failed to undo',
        { mapId: selectedMapId },
        error as Error
      );
      showToast('Failed to undo', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [canUndo, undo, selectedMapId, setMaps, showToast]);
  
  const handleRedo = useCallback(() => {
    if (!canRedo()) {
      showToast('Nothing to redo', 'warning', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
      return;
    }
    
    try {
      const nextState = redo();
      if (nextState && selectedMapId) {
        // Restore the next map state
        const { maps } = useMapStore.getState();
        const updatedMaps = maps.map(map => 
          map.id === selectedMapId ? nextState : map
        );
        setMaps(updatedMaps);
        setHasUnsavedChanges(true);
        showToast('↷ Redo successful', 'info', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
      }
    } catch (error) {
      errorLogger.error(
        ErrorCategory.HISTORY,
        'Failed to redo',
        { mapId: selectedMapId },
        error as Error
      );
      showToast('Failed to redo', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [canRedo, redo, selectedMapId, setMaps, showToast]);
  
  const handleCopy = useCallback(() => {
    if (!currentMap || editor.selectedModuleIds.length === 0) {
      return;
    }
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      copyModules(selectedModules);
      showToast(`📋 Copied ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Failed to copy modules',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to copy modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, editor.selectedModuleIds, copyModules, showToast]);
  
  const handleCut = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) {
      return;
    }
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      // Copy to clipboard
      cutModules(selectedModules);
      
      // Capture state before deleting modules
      pushHistory(currentMap, {
        type: 'module_delete',
        moduleIds: editor.selectedModuleIds,
      });
      
      // Remove modules from map
      editor.selectedModuleIds.forEach(moduleId => {
        removeModule(selectedMapId, moduleId);
      });
      
      setEditor({ selectedModuleIds: [] });
      setHasUnsavedChanges(true);
      showToast(`✂ Cut ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Failed to cut modules',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to cut modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, cutModules, pushHistory, removeModule, setEditor, showToast]);
  
  const handlePaste = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.clipboardModules.length === 0) {
      return;
    }
    
    try {
      // Generate new modules with offset positions
      const newModules = pasteModules(EDITOR_CONSTANTS.PASTE_OFFSET);
      
      if (newModules.length === 0) {
        showToast('No modules to paste', 'warning', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
        return;
      }
      
      // Capture state before adding modules
      pushHistory(currentMap, {
        type: 'bulk_operation',
        description: `Paste ${newModules.length} module(s)`,
      });
      
      // Add all new modules to the map
      newModules.forEach(module => {
        addModule(selectedMapId, module);
      });
      
      // Select the newly pasted modules
      selectModules(newModules.map(m => m.id));
      
      setHasUnsavedChanges(true);
      showToast(`📌 Pasted ${newModules.length} module${newModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Failed to paste modules',
        { clipboardSize: editor.clipboardModules.length },
        error as Error
      );
      showToast('Failed to paste modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.clipboardModules.length, pasteModules, pushHistory, addModule, selectModules, showToast]);
  
  const handleDuplicate = useCallback(() => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) {
      return;
    }
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      // Generate duplicated modules with offset positions
      const newModules = duplicateModules(selectedModules, EDITOR_CONSTANTS.DUPLICATE_OFFSET);
      
      if (newModules.length === 0) {
        showToast('Failed to duplicate modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
        return;
      }
      
      // Capture state before adding modules
      pushHistory(currentMap, {
        type: 'bulk_operation',
        description: `Duplicate ${newModules.length} module(s)`,
      });
      
      // Add all duplicated modules to the map
      newModules.forEach(module => {
        addModule(selectedMapId, module);
      });
      
      // Select the newly duplicated modules
      selectModules(newModules.map(m => m.id));
      
      setHasUnsavedChanges(true);
      showToast(`⎘ Duplicated ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`, 'success', EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Failed to duplicate modules',
        { moduleIds: editor.selectedModuleIds },
        error as Error
      );
      showToast('Failed to duplicate modules', 'error', EDITOR_CONSTANTS.TOAST_DURATION.ERROR);
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, duplicateModules, pushHistory, addModule, selectModules, showToast]);

  // Handle arrow key navigation for selected modules
  const handleMoveSelected = useCallback((direction: 'up' | 'down' | 'left' | 'right', distance: number = 1) => {
    if (!currentMap || !selectedMapId || editor.selectedModuleIds.length === 0) return;
    
    try {
      const selectedModules = currentMap.modules.filter(m => 
        editor.selectedModuleIds.includes(m.id)
      );
      
      pushHistory(currentMap, {
        type: 'module_move',
        moduleIds: editor.selectedModuleIds,
      });
      
      const delta = distance * (editor.snapToGrid ? editor.gridSize : 1);
      
      selectedModules.forEach(module => {
        const newPosition = { ...module.position };
        
        switch (direction) {
          case 'up':
            newPosition.y -= delta;
            break;
          case 'down':
            newPosition.y += delta;
            break;
          case 'left':
            newPosition.x -= delta;
            break;
          case 'right':
            newPosition.x += delta;
            break;
        }
        
        updateModule(selectedMapId, {
          ...module,
          position: newPosition,
          updatedAt: new Date(),
        });
      });
      
      setHasUnsavedChanges(true);
      announce(`Moved ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''} ${direction} ${distance} pixel${distance !== 1 ? 's' : ''}`);
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to move modules with arrow keys',
        { moduleIds: editor.selectedModuleIds, direction, distance },
        error as Error
      );
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, editor.snapToGrid, editor.gridSize, pushHistory, updateModule, announce]);

  // Use keyboard shortcuts hook
  useMapEditorShortcuts({
    enabled: !!currentMap,
    editor,
    hasUnsavedChanges,
    isSaving,
    handlers: {
      onSave: handleSave,
      onCopy: handleCopy,
      onCut: handleCut,
      onPaste: handlePaste,
      onDuplicate: handleDuplicate,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onDelete: handleDelete,
      onDeselect: () => {
        setEditor({ selectedModuleIds: [] });
        announce('Selection cleared');
      },
      onToggleShortcuts: toggleShortcutsDialog,
      onToolChange: (tool) => handleToolChange(tool),
      onSelectAll: () => {
        handleSelectAll();
        if (currentMap) {
          announce(`Selected all ${currentMap.modules.length} modules`);
        }
      },
      onToggleGrid: handleToggleGrid,
      onZoomIn: handleZoomIn,
      onZoomOut: handleZoomOut,
      onMoveSelected: handleMoveSelected,
    },
  });

  useEffect(() => {
    if (currentMap?.imageUrl) {
      const img = new window.Image();
      let isMounted = true;
      // Capture currentMap.imageUrl in a local variable to avoid stale closure
      const imageUrl = currentMap.imageUrl;
      
      img.onload = () => {
        if (isMounted) {
          setBackgroundImage(img);
        }
      };
      
      img.onerror = () => {
        if (isMounted) {
          errorLogger.error(
            ErrorCategory.NETWORK,
            'Failed to load background image',
            { imageUrl },
            new Error('Image load failed')
          );
        }
      };
      
      img.src = imageUrl;
      
      return () => {
        isMounted = false;
        // Clean up: remove image source to prevent memory leaks
        img.src = '';
      };
    } else {
      setBackgroundImage(null);
      return undefined;
    }
  }, [currentMap?.imageUrl]);
  
  // Update canvas dimensions on mount and resize
  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };
    
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, []);
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    
    if (!stage || !pointer) return;
    
    try {
      const mousePointTo = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      const newScale = e.evt.deltaY > 0 
        ? viewport.zoom / EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR 
        : viewport.zoom * EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR;
      const clampedScale = Math.max(
        EDITOR_CONSTANTS.MIN_ZOOM, 
        Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newScale)
      );
      
      setViewport({
        zoom: clampedScale,
        position: {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        },
      });
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to handle wheel zoom',
        { zoom: viewport.zoom },
        error as Error
      );
    }
  }, [viewport.zoom, setViewport]);

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (editor.currentTool === 'move') {
      setIsDragging(true);
      setDragStart({
        x: e.evt.clientX - viewport.position.x,
        y: e.evt.clientY - viewport.position.y,
      });
    }
  }, [editor.currentTool, viewport.position.x, viewport.position.y]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (isDragging && editor.currentTool === 'move') {
      setViewport({
        position: {
          x: e.evt.clientX - dragStart.x,
          y: e.evt.clientY - dragStart.y,
        },
      });
    }
  }, [isDragging, editor.currentTool, dragStart, setViewport]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleToolChange = useCallback((tool: 'select' | 'move' | 'rotate' | 'scale' | 'draw' | 'measure') => {
    setEditor({ currentTool: tool });
    const toolNames = {
      select: 'Select',
      move: 'Pan',
      rotate: 'Rotate',
      scale: 'Scale',
      draw: 'Draw',
      measure: 'Measure'
    };
    const toolName = toolNames[tool];
    showToast(`${toolName} tool activated`, 'info', 1500);
    announce(`${toolName} tool activated`);
    setAnnouncement(`${toolName} tool activated`);
  }, [setEditor, showToast, announce]);

  const handleResetView = useCallback(() => {
    try {
      setViewport({ zoom: EDITOR_CONSTANTS.DEFAULT_ZOOM, position: { x: 0, y: 0 } });
    } catch (error) {
      errorLogger.error(
        ErrorCategory.TRANSFORM,
        'Failed to reset view',
        {},
        error as Error
      );
    }
  }, [setViewport]);

  // Group transform handlers for SelectionBoundingBox
  const handleGroupTransformStart = useCallback(() => {
    // Capture state before group transform
    if (currentMap && selectedMapId) {
      pushHistory(currentMap, {
        type: 'module_move',
        moduleIds: editor.selectedModuleIds,
      });
    }
  }, [currentMap, selectedMapId, editor.selectedModuleIds, pushHistory]);
  
  const handleGroupTransform = useCallback((transform: {
    translation?: { x: number; y: number };
    scale?: { x: number; y: number };
    rotation?: number;
  }) => {
    if (!currentMap || !selectedMapId) return;
    
    const selectedModules = currentMap.modules.filter(m => 
      editor.selectedModuleIds.includes(m.id)
    );
    
    if (selectedModules.length === 0) return;
    
    // Calculate the center point of the group for rotation and scaling
    const bounds = selectedModules.reduce(
      (acc, module) => {
        const minX = Math.min(acc.minX, module.position.x);
        const minY = Math.min(acc.minY, module.position.y);
        const maxX = Math.max(acc.maxX, module.position.x + module.size.width);
        const maxY = Math.max(acc.maxY, module.position.y + module.size.height);
        return { minX, minY, maxX, maxY };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Apply transformations to all selected modules
    selectedModules.forEach(module => {
      const newPosition = { ...module.position };
      const newSize = { ...module.size };
      let newRotation = module.rotation || 0;
      
      // Apply translation
      if (transform.translation) {
        newPosition.x += transform.translation.x;
        newPosition.y += transform.translation.y;
      }
      
      // Apply scaling
      if (transform.scale) {
        // Calculate position relative to center using newPosition to compose with translation
        const relX = newPosition.x - centerX;
        const relY = newPosition.y - centerY;
        
        // Scale position relative to center
        newPosition.x = centerX + relX * transform.scale.x;
        newPosition.y = centerY + relY * transform.scale.y;
        
        // Scale size
        newSize.width = module.size.width * transform.scale.x;
        newSize.height = module.size.height * transform.scale.y;
        
        // Enforce minimum size
        newSize.width = Math.max(EDITOR_CONSTANTS.MIN_MODULE_SIZE.width, newSize.width);
        newSize.height = Math.max(EDITOR_CONSTANTS.MIN_MODULE_SIZE.height, newSize.height);
      }
      
      // Apply rotation
      if (transform.rotation !== undefined) {
        // Calculate position relative to center
        const relX = newPosition.x - centerX;
        const relY = newPosition.y - centerY;
        
        // Convert rotation to radians
        const angleRad = (transform.rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        
        // Rotate position around center
        newPosition.x = centerX + relX * cos - relY * sin;
        newPosition.y = centerY + relX * sin + relY * cos;
        
        // Add rotation to module
        newRotation += transform.rotation;
        
        // Normalize rotation to 0-360 range
        newRotation = ((newRotation % 360) + 360) % 360;
      }
      
      // Update module with new transform
      const updatedModule: AnyModule = {
        ...module,
        position: newPosition,
        size: newSize,
        rotation: newRotation,
        updatedAt: new Date(),
      };
      
      updateModule(selectedMapId, updatedModule);
    });
    
    setHasUnsavedChanges(true);
  }, [currentMap, selectedMapId, editor.selectedModuleIds, updateModule]);
  
  const handleGroupTransformEnd = useCallback(() => {
    // Transform is complete, no additional action needed
    // History was already captured in handleGroupTransformStart
  }, []);

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
    { id: 'move', icon: Move, label: 'Pan', shortcut: 'H' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate', shortcut: 'R' },
    { id: 'scale', icon: Square, label: 'Scale', shortcut: 'S' },
  ];

  if (!currentMap) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Map not found</h2>
          <p className="text-gray-600 dark:text-gray-400">The requested map could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900">
      {/* Module Library Sidebar */}
      <Suspense fallback={<div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center"><PageLoader /></div>}>
        <ModuleLibrary />
      </Suspense>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="toolbar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="toolbar-section">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{currentMap.name}</h1>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-4" />
            
            {/* Tool Buttons */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {tools.map((tool) => {
                const isPressed = editor.currentTool === tool.id;
                return (
                  <Tooltip
                    key={tool.id}
                    content={
                      <div className="text-center">
                        <div className="font-semibold">{tool.label}</div>
                        <div className="text-xs opacity-90">Press {tool.shortcut}</div>
                      </div>
                    }
                    placement="bottom"
                  >
                    <button
                      onClick={() => handleToolChange(tool.id as typeof editor.currentTool)}
                      aria-label={`${tool.label} tool, press ${tool.shortcut} to activate`}
                      aria-pressed={isPressed ? 'true' : 'false'}
                      className={`p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                        isPressed
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm scale-105 ring-2 ring-blue-500 dark:ring-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <tool.icon className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">{tool.label}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
            
            {/* Tool Indicator Badge */}
            {editor.currentTool && (
              <div className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {tools.find(t => t.id === editor.currentTool)?.label || 'Select'}
              </div>
            )}
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-4" />
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <Tooltip content="Zoom Out (-)" placement="bottom">
                <button
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <ZoomOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
              
              {/* Zoom Slider */}
              <div className="flex items-center space-x-2 w-32">
                <label htmlFor="zoom-slider" className="sr-only">
                  Zoom level slider
                </label>
                <input
                  id="zoom-slider"
                  type="range"
                  min={EDITOR_CONSTANTS.MIN_ZOOM}
                  max={EDITOR_CONSTANTS.MAX_ZOOM}
                  step={0.01}
                  value={viewport.zoom}
                  onChange={(e) => handleZoomSliderChange(parseFloat(e.target.value))}
                  aria-label={`Zoom level ${Math.round(viewport.zoom * 100)} percent`}
                  aria-valuemin={EDITOR_CONSTANTS.MIN_ZOOM}
                  aria-valuemax={EDITOR_CONSTANTS.MAX_ZOOM}
                  aria-valuenow={viewport.zoom}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <Tooltip content={`Zoom: ${Math.round(viewport.zoom * 100)}%`} placement="bottom">
                <button
                  onClick={handleResetView}
                  aria-label={`Current zoom level ${Math.round(viewport.zoom * 100)} percent. Click to reset to 100 percent.`}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-150 min-w-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {Math.round(viewport.zoom * 100)}%
                </button>
              </Tooltip>
              
              <Tooltip content="Zoom In (+)" placement="bottom">
                <button
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
              
              <Tooltip content="Fit to Screen" placement="bottom">
                <button
                  onClick={handleFitToScreen}
                  aria-label="Fit map to screen"
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <Maximize2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
              
              <Tooltip 
                content={editor.selectedModuleIds.length > 0 ? "Zoom to Selection" : "Select modules to zoom"} 
                placement="bottom"
                disabled={editor.selectedModuleIds.length === 0}
              >
                <button
                  onClick={handleZoomToSelection}
                  disabled={editor.selectedModuleIds.length === 0}
                  aria-label={editor.selectedModuleIds.length > 0 ? `Zoom to ${editor.selectedModuleIds.length} selected module${editor.selectedModuleIds.length > 1 ? 's' : ''}` : "Select modules to zoom to selection"}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>
          
          <div className="toolbar-section">
            {/* View Options */}
            <div className="flex items-center space-x-2">
              <Tooltip content="Toggle Grid (G)" placement="bottom">
                {(() => {
                  const isGridVisible = editor.showGrid;
                  return (
                    <button
                      onClick={handleToggleGrid}
                      aria-label={`Grid is ${isGridVisible ? 'visible' : 'hidden'}. Press G to toggle.`}
                      aria-pressed={isGridVisible ? 'true' : 'false'}
                      className={`p-2 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                        isGridVisible 
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  );
                })()}
              </Tooltip>
              <Tooltip content="Toggle Rulers" placement="bottom">
                {(() => {
                  const areRulersVisible = editor.showRulers;
                  return (
                    <button
                      onClick={() => {
                        try {
                          const newRulerState = !areRulersVisible;
                          setEditor({ showRulers: newRulerState });
                          showToast(`Rulers ${newRulerState ? 'enabled' : 'disabled'}`, 'info', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
                        } catch (error) {
                          errorLogger.error(
                            ErrorCategory.STATE,
                            'Failed to toggle rulers',
                            {},
                            error as Error
                          );
                        }
                      }}
                      aria-label={`Rulers are ${areRulersVisible ? 'visible' : 'hidden'}. Click to toggle.`}
                      aria-pressed={areRulersVisible ? 'true' : 'false'}
                      className={`p-2 rounded-md transition-all ${
                        areRulersVisible 
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Ruler className="w-4 h-4" />
                    </button>
                  );
                })()}
              </Tooltip>
              <Tooltip content="Keyboard Shortcuts (? or F1)" placement="bottom">
                <button
                  onClick={toggleShortcutsDialog}
                  aria-label="Show keyboard shortcuts dialog. Press ? or F1 to open."
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-4" />
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Tooltip content="Undo (Ctrl+Z)" placement="bottom">
                <button
                  onClick={handleUndo}
                  aria-label={`Undo last action${!canUndo() ? ' (no actions to undo)' : ''}`}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  disabled={!canUndo()}
                >
                  <Undo className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
              <Tooltip content="Redo (Ctrl+Y)" placement="bottom">
                <button
                  onClick={handleRedo}
                  aria-label={`Redo last undone action${!canRedo() ? ' (no actions to redo)' : ''}`}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  disabled={!canRedo()}
                >
                  <Redo className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
              
              {hasUnsavedChanges && (
                <Tooltip 
                  content={
                    <div>
                      <div className="font-semibold mb-1">Unsaved Changes</div>
                      {moduleValidationErrors.size > 0 && (
                        <div className="text-xs mt-1">
                          {moduleValidationErrors.size} module{moduleValidationErrors.size > 1 ? 's have' : ' has'} validation errors
                        </div>
                      )}
                    </div>
                  }
                  placement="bottom"
                >
                  <span className={`text-xs flex items-center ${
                    moduleValidationErrors.size > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  } ${hasUnsavedChanges ? 'animate-pulse' : ''}`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {moduleValidationErrors.size > 0 ? `${moduleValidationErrors.size} error${moduleValidationErrors.size > 1 ? 's' : ''}` : 'Unsaved changes'}
                  </span>
                </Tooltip>
              )}
              
              {saveError && (
                <div className="flex items-center space-x-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-3 h-3" />
                  <span>Save failed</span>
                  <button
                    onClick={handleSave}
                    className="px-2 py-0.5 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 rounded font-medium transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              <Tooltip 
                content={
                  <div>
                    <div className="font-semibold">Save Map</div>
                    <div className="text-xs opacity-90 mt-1">Ctrl+S</div>
                    {moduleValidationErrors.size > 0 && (
                      <div className="text-xs mt-2 text-red-200">
                        Fix validation errors before saving
                      </div>
                    )}
                  </div>
                }
                placement="bottom"
              >
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!hasUnsavedChanges && !saveError) || moduleValidationErrors.size > 0}
                  className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed relative"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                  {moduleValidationErrors.size > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white">
                      !
                    </span>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* Bulk Operations Toolbar - Shows when multiple modules are selected */}
        {editor.selectedModuleIds.length > 1 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {editor.selectedModuleIds.length} modules selected
                </span>
                
                <div className="h-6 w-px bg-blue-300 dark:bg-blue-700" />
                
                {/* Lock/Unlock */}
                <div className="flex items-center space-x-1">
                  <Tooltip content="Lock All" placement="bottom">
                    <button
                      onClick={handleBulkLock}
                      aria-label={`Lock all ${editor.selectedModuleIds.length} selected modules`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Unlock All" placement="bottom">
                    <button
                      onClick={handleBulkUnlock}
                      aria-label={`Unlock all ${editor.selectedModuleIds.length} selected modules`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Unlock className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </Tooltip>
                </div>
                
                {/* Visibility */}
                <div className="flex items-center space-x-1">
                  <Tooltip content="Show All" placement="bottom">
                    <button
                      onClick={() => handleBulkVisibility(true)}
                      aria-label={`Show all ${editor.selectedModuleIds.length} selected modules`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Hide All" placement="bottom">
                    <button
                      onClick={() => handleBulkVisibility(false)}
                      aria-label={`Hide all ${editor.selectedModuleIds.length} selected modules`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
                
                <div className="h-6 w-px bg-blue-300 dark:bg-blue-700" />
                
                {/* Alignment Tools */}
                <div className="flex items-center space-x-1">
                  <Tooltip content="Align Left" placement="bottom">
                    <button
                      onClick={() => handleAlignModules('left')}
                      aria-label={`Align ${editor.selectedModuleIds.length} selected modules to the left`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Align Center (Horizontal)" placement="bottom">
                    <button
                      onClick={() => handleAlignModules('center')}
                      aria-label={`Align ${editor.selectedModuleIds.length} selected modules to the center horizontally`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Align Right" placement="bottom">
                    <button
                      onClick={() => handleAlignModules('right')}
                      aria-label={`Align ${editor.selectedModuleIds.length} selected modules to the right`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Align Top" placement="bottom">
                    <button
                      onClick={() => handleAlignModules('top')}
                      aria-label={`Align ${editor.selectedModuleIds.length} selected modules to the top`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <AlignVerticalJustifyStart className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Align Bottom" placement="bottom">
                    <button
                      onClick={() => handleAlignModules('bottom')}
                      aria-label={`Align ${editor.selectedModuleIds.length} selected modules to the bottom`}
                      className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
                    >
                      <AlignVerticalJustifyEnd className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              
              <button
                onClick={() => setEditor({ selectedModuleIds: [] })}
                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
        
        {/* Canvas Container */}
        <div 
          ref={canvasContainerRef}
          className={`flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-950 ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          role="application"
          aria-label={`Map editor canvas for ${currentMap.name}. ${currentMap.modules.length} modules on map. ${editor.selectedModuleIds.length} selected.`}
          aria-describedby="canvas-instructions"
          tabIndex={0}
        >
          <div id="canvas-instructions" className="sr-only">
            Use arrow keys to move selected modules. Press Shift with arrow keys to move by 10 pixels. Press V for select tool, H for pan tool, R for rotate tool, S for scale tool.
          </div>
          {isOver && (
            <div className="absolute inset-0 border-4 border-dashed border-blue-400 dark:border-blue-500 pointer-events-none z-50 flex items-center justify-center">
              <div className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                Drop module here
              </div>
            </div>
          )}
          
          <div ref={setDropRef} className="w-full h-full">
            <Stage
            ref={stageRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            scaleX={viewport.zoom}
            scaleY={viewport.zoom}
            x={viewport.position.x}
            y={viewport.position.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              cursor: 
                editor.currentTool === 'move' ? (isDragging ? 'grabbing' : 'grab') :
                editor.currentTool === 'rotate' ? 'crosshair' :
                editor.currentTool === 'scale' ? 'nwse-resize' :
                editor.currentTool === 'select' ? 'default' :
                'default'
            }}
          >
            <Layer>
              {/* Background Image */}
              {backgroundImage && (
                <Image
                  image={backgroundImage}
                  width={currentMap.imageSize.width}
                  height={currentMap.imageSize.height}
                  // Enable caching for static background
                  cache={true}
                  perfectDrawEnabled={false}
                />
              )}
              
              {/* Grid - Cached for performance */}
              {editor.showGrid && (
                <Suspense fallback={null}>
                  <MapGrid
                    width={currentMap.imageSize.width}
                    height={currentMap.imageSize.height}
                    gridSize={editor.gridSize}
                    isDark={document.documentElement.classList.contains('dark')}
                  />
                </Suspense>
              )}
              
              {/* Modules - Only render visible modules for performance */}
              <Suspense fallback={null}>
                {visibleModules.map((module) => (
                  <ModuleRenderer
                    key={module.id}
                    module={module}
                    isSelected={editor.selectedModuleIds.includes(module.id)}
                    hasValidationErrors={moduleValidationErrors.has(module.id)}
                    onSelect={() => {
                      if (editor.selectedModuleIds.includes(module.id)) {
                        setEditor({
                          selectedModuleIds: editor.selectedModuleIds.filter(id => id !== module.id)
                        });
                        announce('Module deselected');
                      } else {
                        setEditor({
                          selectedModuleIds: [...editor.selectedModuleIds, module.id]
                        });
                        const moduleName = module.metadata && 'name' in module.metadata ? module.metadata.name : module.type;
                        announce(`Module ${moduleName} selected`);
                      }
                    }}
                  />
                ))}
              </Suspense>
              
              {/* Multi-Selection Bounding Box */}
              {editor.selectedModuleIds.length > 1 && (
                <Suspense fallback={null}>
                  <SelectionBoundingBox
                    modules={currentMap.modules.filter(m => 
                      editor.selectedModuleIds.includes(m.id)
                    )}
                    onTransformStart={handleGroupTransformStart}
                    onTransform={handleGroupTransform}
                    onTransformEnd={handleGroupTransformEnd}
                    snapToGrid={editor.snapToGrid}
                    gridSize={editor.gridSize}
                  />
                </Suspense>
              )}
            </Layer>
          </Stage>
          </div>
          
          {/* Rulers */}
          {editor.showRulers && canvasDimensions.width > 0 && (
            <Suspense fallback={null}>
              <RulerComponent
                orientation="horizontal"
                length={canvasDimensions.width}
                zoom={viewport.zoom}
                offset={viewport.position.x}
              />
              <RulerComponent
                orientation="vertical"
                length={canvasDimensions.height}
                zoom={viewport.zoom}
                offset={viewport.position.y}
              />
            </Suspense>
          )}
          
          {/* Enhanced Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-between px-4 text-sm">
            <div className="flex items-center space-x-6">
              <Tooltip content="Click to reset zoom to 100%" placement="top">
                <button
                  onClick={handleResetView}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
                >
                  Zoom: {Math.round(viewport.zoom * 100)}%
                </button>
              </Tooltip>
              
              <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
              
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">{editor.selectedModuleIds.length}</span> selected
              </span>
              
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">{currentMap.modules.length}</span> modules
              </span>
              
              {moduleValidationErrors.size > 0 && (
                <>
                  <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
                  <Tooltip 
                    content={
                      <div>
                        <div className="font-semibold mb-1">Validation Errors</div>
                        <div className="text-xs">
                          {Array.from(moduleValidationErrors.entries()).map(([moduleId, errors]) => (
                            <div key={moduleId} className="mt-1">
                              Module: {errors.length} error{errors.length > 1 ? 's' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                    placement="top"
                  >
                    <span className="text-red-600 dark:text-red-400 font-medium flex items-center cursor-help">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {moduleValidationErrors.size} error{moduleValidationErrors.size > 1 ? 's' : ''}
                    </span>
                  </Tooltip>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              <Tooltip content={`Grid size: ${editor.gridSize}px`} placement="top">
                <button
                  onClick={handleToggleGrid}
                  className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                    editor.showGrid ? 'font-medium text-gray-900 dark:text-gray-100' : ''
                  }`}
                >
                  Grid: {editor.gridSize}px
                </button>
              </Tooltip>
              
              <Tooltip content="Click to toggle snap to grid" placement="top">
                <button
                  onClick={() => setEditor({ snapToGrid: !editor.snapToGrid })}
                  className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                    editor.snapToGrid ? 'font-medium text-gray-900 dark:text-gray-100' : ''
                  }`}
                >
                  Snap: {editor.snapToGrid ? 'On' : 'Off'}
                </button>
              </Tooltip>
              
              {hasUnsavedChanges && (
                <>
                  <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unsaved
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Properties Panel */}
      <Suspense fallback={<div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center"><PageLoader /></div>}>
        <PropertiesPanel 
          onModuleChange={() => setHasUnsavedChanges(true)} 
          onUnsavedChanges={() => setHasUnsavedChanges(true)}
        />
      </Suspense>
      
      {/* Keyboard Shortcuts Dialog */}
      <Suspense fallback={null}>
        <KeyboardShortcutsDialog
          isOpen={editor.showShortcutsDialog}
          onClose={toggleShortcutsDialog}
        />
      </Suspense>
      
      {/* Screen Reader Live Region */}
      <LiveRegion message={announcement} politeness="polite" />
    </div>
  );
};

export default MapEditor;
