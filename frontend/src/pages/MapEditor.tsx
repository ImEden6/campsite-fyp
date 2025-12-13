/**
 * MapEditor Page
 * Main page component for the campsite map editor.
 * Uses Fabric.js for canvas rendering with pan/zoom controls.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as fabric from 'fabric';
import { ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet, Hand, Layers, Settings, Download, Ruler } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { useEditorStore } from '@/stores/editorStore';
import { PageLoader } from '@/components/ui/PageLoader';
import { Tooltip } from '@/components/ui/Tooltip';
import { createModuleObject, createNewModule, extractModuleChanges, getModuleId, isGridObject, updateModuleObject } from '@/utils/moduleFactory';

// Import opacity constants for state checks
const OPACITY_HIDDEN = 0.3;
import { MoveCommand, TransformCommand, AddCommand, DeleteCommand } from '@/commands';
import { useCommandHistory } from '@/hooks';
import type { AnyModule, ModuleType, Position } from '@/types';
import {
    ModuleToolbox,
    PropertiesPanel,
    LayersPanel,
    Rulers,
    AlignmentToolbar,
    ExportDialog,
} from '@/components/editor';

// Constants
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;
const DEFAULT_GRID_SIZE = 20;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const FIT_TO_SCREEN_PADDING = 0.9; // Padding factor for fit-to-screen calculation

const MapEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const objectMapRef = useRef<Map<string, fabric.Group>>(new Map());

    // Transform tracking
    const transformStartRef = useRef<{
        id: string;
        position: Position;
        size: { width: number; height: number };
        rotation: number;
    } | null>(null);

    // Local state
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [selectedCount, setSelectedCount] = useState(0);
    const [isPanMode, setIsPanMode] = useState(false);
    const [containerReady, setContainerReady] = useState(false);

    // Panel visibility state
    const [showToolbox] = useState(true);
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showRulers, setShowRulers] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);

    // Ref to the HTML canvas element for export
    const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);
    
    // Ref to track animation frame for cleanup
    const rafIdRef = useRef<number | null>(null);
    
    // Guard to prevent concurrent rendering
    const isRenderingRef = useRef(false);

    // Callback ref to detect when container mounts
    const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (node) {
            setContainerReady(true);
        }
    }, []);

    // Store state
    const { currentMap, isLoading, isDirty, setMap, setLoading, markDirty, getModule } = useMapStore();

    // Editor store state for selection sync and clipboard
    const {
        selectedIds,
        setSelection,
        clipboard,
        clipboardOffset,
        copyToClipboard,
        cutToClipboard,
        moduleToAdd,
        setModuleToAdd,
        activeTool,
    } = useEditorStore();

    // Command history management
    const {
        undo,
        redo,
        canUndo,
        canRedo,
        executeCommand,
        executeCommandRef,
        undoRef,
        redoRef,
    } = useCommandHistory({
        onCommandExecuted: markDirty,
    });

    // Initialize canvas - runs when container becomes ready
    useEffect(() => {
        if (!containerReady || !containerRef.current || canvasRef.current) return;

        const container = containerRef.current;
        const canvas = new fabric.Canvas('map-canvas', {
            width: container.offsetWidth,
            height: container.offsetHeight,
            selection: true,
            preserveObjectStacking: true,
            backgroundColor: '#e5e7eb',
        });

        // Configure default control appearance
        fabric.FabricObject.prototype.set({
            cornerStyle: 'circle',
            cornerColor: '#000000ff',
            cornerStrokeColor: '#000000ff',
            cornerSize: 10,
            transparentCorners: false,
            borderColor: '#000000ff',
            borderScaleFactor: 2,
        });

        // Customizing rotation control specifically
        // In Fabric.js v6, we need to modify the control directly on the prototype
        // and ensure the custom render is used
        try {
            const defaultControls = fabric.FabricObject.prototype.controls;
            if (defaultControls && defaultControls.mtr) {
                // Store original to preserve behavior
                const originalMtr = defaultControls.mtr;

                // Create custom render function for purple rotation handle
                const customRotationRender = (
                    ctx: CanvasRenderingContext2D,
                    left: number,
                    top: number,
                    _styleOverride: unknown,
                    _fabricObject: fabric.FabricObject
                ) => {
                    const size = 12;
                    ctx.save();
                    ctx.translate(left, top);

                    // Draw purple rotation handle
                    ctx.fillStyle = '#9333ea';
                    ctx.strokeStyle = '#7e22ce';
                    ctx.lineWidth = 2;

                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2, false);
                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();
                };

                // Assign custom render to the existing control
                originalMtr.render = customRotationRender;
            } else {
                console.warn('[MapEditor] Could not find defaultControls.mtr - controls:', defaultControls);
            }
        } catch (error) {
            console.error('[MapEditor] Error customizing rotation control:', error);
        }

        canvasRef.current = canvas;

        // Disable double-click behavior on canvas
        const handleDoubleClick = (e: fabric.TPointerEventInfo<MouseEvent>) => {
            e.e.stopPropagation();
            e.e.preventDefault();
        };
        canvas.on('mouse:dblclick', handleDoubleClick);

        // Handle selection changes - sync with editorStore
        const syncSelection = () => {
            const activeObjects = canvas.getActiveObjects();
            const validIds: string[] = [];
            const lockedIds: string[] = [];
            
            activeObjects.forEach(obj => {
                const moduleId = getModuleId(obj);
                if (!moduleId) return;
                
                // Check if module is locked - prevent selection
                const module = getModule(moduleId);
                if (module?.locked) {
                    lockedIds.push(moduleId);
                } else {
                    validIds.push(moduleId);
                }
            });
            
            // If any locked modules were selected, deselect them
            if (lockedIds.length > 0) {
                const lockedObjects = lockedIds
                    .map(id => objectMapRef.current.get(id))
                    .filter((obj): obj is fabric.Group => obj !== undefined);
                
                if (lockedObjects.length > 0) {
                    // Remove locked objects from selection
                    const remainingObjects = activeObjects.filter(obj => {
                        const moduleId = getModuleId(obj);
                        return moduleId && !lockedIds.includes(moduleId);
                    });
                    
                    if (remainingObjects.length === 0) {
                        canvas.discardActiveObject();
                    } else if (remainingObjects.length === 1) {
                        canvas.setActiveObject(remainingObjects[0]!);
                    } else {
                        const selection = new fabric.ActiveSelection(remainingObjects, { canvas });
                        canvas.setActiveObject(selection);
                    }
                }
            }
            
            setSelection(validIds);
            setSelectedCount(validIds.length);
        };

        const handleSelectionCleared = () => {
            setSelection([]);
            setSelectedCount(0);
        };

        canvas.on('selection:created', syncSelection);
        canvas.on('selection:updated', syncSelection);
        canvas.on('selection:cleared', handleSelectionCleared);

        // Handle object modification start
        // Bug 1 Fix: Capture transform start state before snap-to-grid modifies position
        // This handler must run before the snap-to-grid handler to capture original position
        const handleTransformStart = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!transformStartRef.current && e.target) {
                const moduleId = getModuleId(e.target);
                if (moduleId) {
                    // Check if module is locked - prevent transformation
                    const module = getModule(moduleId);
                    if (module?.locked) {
                        // Cancel the transformation
                        e.target.setCoords();
                        return;
                    }
                    // Capture the ORIGINAL position before any modifications (like snap-to-grid)
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        };

        // Register with high priority (before other handlers)
        canvas.on('object:moving', handleTransformStart);

        const handleObjectScaling = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!transformStartRef.current && e.target) {
                const moduleId = getModuleId(e.target);
                if (moduleId) {
                    // Check if module is locked - prevent transformation
                    const module = getModule(moduleId);
                    if (module?.locked) {
                        // Cancel the transformation
                        e.target.setCoords();
                        return;
                    }
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        };

        const handleObjectRotating = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!transformStartRef.current && e.target) {
                const moduleId = getModuleId(e.target);
                if (moduleId) {
                    // Check if module is locked - prevent transformation
                    const module = getModule(moduleId);
                    if (module?.locked) {
                        // Cancel the transformation
                        e.target.setCoords();
                        return;
                    }
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        };

        canvas.on('object:scaling', handleObjectScaling);
        canvas.on('object:rotating', handleObjectRotating);

        // Handle object modification end
        const handleObjectModified = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!e.target || !transformStartRef.current) return;

            try {
                const moduleId = getModuleId(e.target);
                if (!moduleId) return;

                // Preserve current selection before executing command
                const activeObjects = canvas.getActiveObjects();
                const selectedIds = activeObjects
                    .map(obj => getModuleId(obj))
                    .filter((id): id is string => id !== null);

                const startState = transformStartRef.current;
                const changes = extractModuleChanges(e.target as fabric.Group);

                // Use ref to access latest executeCommand function
                const executeCommand = executeCommandRef.current;

                if (!executeCommand) {
                    console.warn('[MapEditor] executeCommand not available in object:modified handler');
                    transformStartRef.current = null;
                    return;
                }

                // Check if it was just a move or a full transform
                const sizeChanged =
                    startState.size.width !== changes.size.width ||
                    startState.size.height !== changes.size.height;
                const rotationChanged = startState.rotation !== changes.rotation;

                if (sizeChanged || rotationChanged) {
                    // Use TransformCommand for resize/rotate
                    executeCommand(new TransformCommand({
                        id: moduleId,
                        oldPosition: startState.position,
                        newPosition: changes.position,
                        oldSize: startState.size,
                        newSize: changes.size,
                        oldRotation: startState.rotation,
                        newRotation: changes.rotation,
                    }));
                } else {
                    // Use MoveCommand for just position changes
                    executeCommand(new MoveCommand([{
                        id: moduleId,
                        oldPosition: startState.position,
                        newPosition: changes.position,
                    }]));
                }

                transformStartRef.current = null;

                // Restore selection after command execution
                // Use requestAnimationFrame to ensure command has been processed
                // Cancel any pending animation frame first
                if (rafIdRef.current !== null) {
                    cancelAnimationFrame(rafIdRef.current);
                }
                
                rafIdRef.current = requestAnimationFrame(() => {
                    rafIdRef.current = null;
                    if (selectedIds.length > 0 && canvasRef.current) {
                        const canvas = canvasRef.current;
                        const objectsToSelect = selectedIds
                            .map(id => {
                                const obj = objectMapRef.current.get(id);
                                return obj;
                            })
                            .filter((obj): obj is fabric.Group => obj !== undefined);

                        if (objectsToSelect.length > 0) {
                            if (objectsToSelect.length === 1) {
                                const obj = objectsToSelect[0];
                                if (obj) {
                                    canvas.setActiveObject(obj);
                                }
                            } else {
                                const selection = new fabric.ActiveSelection(objectsToSelect, { canvas });
                                canvas.setActiveObject(selection);
                            }
                            canvas.requestRenderAll();
                        }
                    }
                });
            } catch (error) {
                console.error('[MapEditor] Error handling object modification:', error);
                
                // Error recovery: restore object to previous state
                if (e.target && transformStartRef.current) {
                    try {
                        const startState = transformStartRef.current;
                        const obj = e.target as fabric.Group;
                        const currentWidth = obj.width || 1;
                        const currentHeight = obj.height || 1;
                        
                        // Restore to center-based coordinates
                        const centerX = startState.position.x + startState.size.width / 2;
                        const centerY = startState.position.y + startState.size.height / 2;
                        
                        obj.set({
                            left: centerX,
                            top: centerY,
                            scaleX: startState.size.width / currentWidth,
                            scaleY: startState.size.height / currentHeight,
                            angle: startState.rotation,
                        });
                        obj.setCoords();
                        
                        if (canvasRef.current) {
                            canvasRef.current.requestRenderAll();
                        }
                    } catch (recoveryError) {
                        console.error('[MapEditor] Error during recovery:', recoveryError);
                    }
                }
                
                transformStartRef.current = null; // Reset state on error
            }
        };

        canvas.on('object:modified', handleObjectModified);

        // Handle resize
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                canvasRef.current.setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Cancel any pending animation frames
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            // Remove all canvas event listeners
            canvas.off('selection:created', syncSelection);
            canvas.off('selection:updated', syncSelection);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('object:moving', handleTransformStart);
            canvas.off('object:scaling', handleObjectScaling);
            canvas.off('object:rotating', handleObjectRotating);
            canvas.off('object:modified', handleObjectModified);
            canvas.off('mouse:dblclick', handleDoubleClick);
            canvas.dispose();
            canvasRef.current = null;
        };
        // Note: executeCommandRef and setSelection are refs/functions that don't need to be in dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerReady]);

    // Handle mouse wheel zoom
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (opt: fabric.TPointerEventInfo<WheelEvent>) => {
            const event = opt.e;
            event.preventDefault();

            const delta = event.deltaY;
            let newZoom = canvas.getZoom() * (delta > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR);
            newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

            const pointer = canvas.getViewportPoint(event);
            canvas.zoomToPoint(pointer, newZoom);
            setZoom(newZoom);
            // Auto-disable pan mode when zooming below 100%
            if (newZoom < 1) {
                setIsPanMode(false);
            }
        };

        canvas.on('mouse:wheel', handleWheel);

        return () => {
            canvas.off('mouse:wheel', handleWheel);
        };
    }, [setZoom, setIsPanMode]);

    // Handle pan with alt+drag, middle mouse, or pan mode
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let isPanning = false;
        let lastPosX = 0;
        let lastPosY = 0;

        const handleMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
            const event = opt.e as MouseEvent;

            // Handle Add Tool Click
            // Only add if:
            // 1. Tool is 'add' and we have a module to add
            // 2. Not holding Alt (which triggers pan)
            // 3. Left click only (button 0)
            if (activeTool === 'add' && moduleToAdd && !event.altKey && event.button === 0) {
                try {
                    const pointer = canvas.getPointer(event);

                    const newModule = createNewModule(
                        moduleToAdd,
                        { x: pointer.x, y: pointer.y }
                    );

                    // Execute Add Command
                    const executeCommand = executeCommandRef.current;
                    if (executeCommand) {
                        executeCommand(new AddCommand([newModule]));
                    } else {
                        console.warn('[MapEditor] executeCommand not available in handleMouseDown');
                    }

                    // Reset tool
                    setModuleToAdd(null);
                } catch (error) {
                    console.error('[MapEditor] Error adding module on click:', error);
                }
                return;
            }

            // Pan with alt+drag, middle mouse, or when pan mode is active
            if ('altKey' in event && (event.altKey || event.button === 1 || isPanMode)) {
                isPanning = true;
                lastPosX = event.clientX;
                lastPosY = event.clientY;
                canvas.selection = false;
            }
        };

        const handleMouseMove = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
            if (!isPanning) return;
            const event = opt.e as MouseEvent;
            const vpt = canvas.viewportTransform;
            if (vpt) {
                vpt[4] += event.clientX - lastPosX;
                vpt[5] += event.clientY - lastPosY;
                canvas.requestRenderAll();
            }
            lastPosX = event.clientX;
            lastPosY = event.clientY;
        };

        const handleMouseUp = () => {
            isPanning = false;
            // Only re-enable selection if not in pan mode
            if (!isPanMode) {
                canvas.selection = true;
            }
        };

        // When pan mode changes, update canvas selection state
        canvas.selection = !isPanMode && activeTool === 'select';

        // Update cursor
        canvas.defaultCursor = activeTool === 'add' ? 'crosshair' : 'default';
        canvas.hoverCursor = activeTool === 'add' ? 'crosshair' : 'move';

        // Handle cursor change for locked modules
        // Track current cursor state to avoid unnecessary re-renders
        let currentCursor: string | null = null;
        
        const handleMouseOver = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
            const target = opt.target;
            if (!target) return;
            
            const moduleId = getModuleId(target);
            if (moduleId) {
                const module = getModule(moduleId);
                if (module?.locked) {
                    // Only update cursor if it's not already set
                    if (currentCursor !== 'not-allowed') {
                        canvas.defaultCursor = 'not-allowed';
                        canvas.hoverCursor = 'not-allowed';
                        currentCursor = 'not-allowed';
                        canvas.renderAll();
                    }
                }
            }
        };

        const handleMouseOut = () => {
            // Only reset if cursor was changed
            if (currentCursor === 'not-allowed') {
                const newCursor = activeTool === 'add' ? 'crosshair' : 'default';
                canvas.defaultCursor = newCursor;
                canvas.hoverCursor = activeTool === 'add' ? 'crosshair' : 'move';
                currentCursor = newCursor;
                canvas.renderAll();
            }
        };

        canvas.on('mouse:over', handleMouseOver);
        canvas.on('mouse:out', handleMouseOut);
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:over', handleMouseOver);
            canvas.off('mouse:out', handleMouseOut);
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
        // Note: executeCommandRef is intentionally excluded from dependencies
        // as it's a ref that provides stable access to the latest executeCommand function
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPanMode, activeTool, moduleToAdd, setModuleToAdd]);

    // Load map data (mock for now)
    useEffect(() => {
        if (!id) {
            console.error('[MapEditor] No map ID provided in route');
            return;
        }

        if (!currentMap || currentMap.id !== id) {
            setLoading(true);
            // TODO: Replace with actual API call
            const timeoutId = setTimeout(() => {

                if (id === 'new') {
                    // Initialize blank map
                    setMap({
                        id: 'new',
                        name: 'New Map',
                        description: 'Start designing your campsite',
                        imageUrl: '',
                        imageSize: { width: 800, height: 600 },
                        scale: 1,
                        bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
                        modules: [],
                        metadata: {
                            address: '',
                            coordinates: { latitude: 0, longitude: 0 },
                            timezone: 'UTC',
                            capacity: 0,
                            amenities: [],
                            rules: [],
                            emergencyContacts: [],
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                } else {
                    // Load sample map (mock)
                    setMap({
                        id,
                        name: 'Sample Campsite',
                        description: 'A sample campsite map',
                        imageUrl: '',
                        imageSize: { width: 1920, height: 1080 },
                        scale: 1, // Changed from 10 to 1 for better default view
                        bounds: { minX: 0, minY: 0, maxX: 1920, maxY: 1080 },
                        modules: [
                            {
                                id: 'module-1',
                                type: 'campsite',
                                position: { x: 100, y: 100 },
                                size: { width: 120, height: 80 },
                                rotation: 0,
                                zIndex: 1,
                                locked: false,
                                visible: true,
                                metadata: {
                                    name: 'Site A1',
                                    capacity: 4,
                                    amenities: ['fire_pit'],
                                    pricing: { basePrice: 35, seasonalMultiplier: 1 },
                                    accessibility: false,
                                    electricHookup: true,
                                    waterHookup: true,
                                    sewerHookup: false,
                                },
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                            {
                                id: 'module-2',
                                type: 'toilet',
                                position: { x: 300, y: 150 },
                                size: { width: 80, height: 80 },
                                rotation: 0,
                                zIndex: 2,
                                locked: false,
                                visible: true,
                                metadata: {
                                    name: 'Restroom A',
                                    capacity: 10,
                                    facilities: ['male', 'female', 'accessible'],
                                    maintenanceSchedule: 'daily',
                                    accessible: true,
                                },
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                            {
                                id: 'module-3',
                                type: 'parking',
                                position: { x: 500, y: 100 },
                                size: { width: 200, height: 100 },
                                rotation: 0,
                                zIndex: 1,
                                locked: false,
                                visible: true,
                                metadata: {
                                    name: 'Parking Lot A',
                                    capacity: 20,
                                    vehicleTypes: ['car', 'rv'],
                                    accessible: true,
                                },
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        ] as AnyModule[],
                        metadata: {
                            address: '123 Camp Road',
                            coordinates: { latitude: 0, longitude: 0 },
                            timezone: 'UTC',
                            capacity: 100,
                            amenities: [],
                            rules: [],
                            emergencyContacts: [],
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                setLoading(false);
            }, 500);

            return () => {
                clearTimeout(timeoutId);
            };
        }
        return undefined;
    }, [id, currentMap, setMap, setLoading]);

    // Render modules to canvas when map loads
    useEffect(() => {
        const canvas = canvasRef.current;
        // Prevent rendering if map is still loading or canvas not ready
        if (!canvas || !currentMap || isLoading) return;
        
        // Prevent concurrent renders
        if (isRenderingRef.current) return;
        isRenderingRef.current = true;

        try {
            // Clear existing objects
            canvas.clear();
            canvas.backgroundColor = '#e5e7eb';
            objectMapRef.current.clear();

            // Add map background
            const background = new fabric.Rect({
                left: 0,
                top: 0,
                width: currentMap.imageSize.width,
                height: currentMap.imageSize.height,
                fill: '#f8f9fa',
                stroke: '#dee2e6',
                strokeWidth: 2,
                selectable: false,
                evented: false,
            });
            canvas.add(background);

            // Sort modules by zIndex and add to canvas
            const sortedModules = [...currentMap.modules].sort((a, b) => a.zIndex - b.zIndex);
            for (const module of sortedModules) {
                const obj = createModuleObject(module);
                canvas.add(obj);
                objectMapRef.current.set(module.id, obj);
            }

            canvas.requestRenderAll();
        } catch (error) {
            console.error('[MapEditor] Error rendering modules to canvas:', error);
        } finally {
            // Reset rendering flag after a frame to allow re-renders
            requestAnimationFrame(() => {
                isRenderingRef.current = false;
            });
        }
    }, [currentMap, containerReady, isLoading]);

    // Update canvas objects when module locked/visible state changes
    // Only update modules that have actually changed locked/visible state
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentMap) return;

        // Track which modules need updating
        const modulesToUpdate: Array<{ module: AnyModule; obj: fabric.Group }> = [];
        let hasErrors = false;

        currentMap.modules.forEach((module) => {
            const obj = objectMapRef.current.get(module.id);
            if (!obj) return;

            // Check if locked/visible state actually changed
            const currentLocked = obj.lockMovementX === true;
            const currentVisible = obj.opacity !== undefined && obj.opacity > OPACITY_HIDDEN;
            
            const shouldUpdate = 
                currentLocked !== module.locked || 
                currentVisible !== module.visible;

            if (shouldUpdate) {
                modulesToUpdate.push({ module, obj });
            }
        });

        // Update only modules that changed
        modulesToUpdate.forEach(({ module, obj }) => {
            try {
                updateModuleObject(obj, module);
            } catch (error) {
                console.error(`[MapEditor] Error updating module ${module.id}:`, error);
                hasErrors = true;
            }
        });

        if (hasErrors) {
            console.warn('[MapEditor] Some modules failed to update. Check console for details.');
        }

        if (modulesToUpdate.length > 0) {
            canvas.requestRenderAll();
        }
        // Note: We only want to update when locked/visible state changes, not on every currentMap change
        // The effect compares current state with module state to determine what needs updating
    }, [currentMap]);

    // Draw grid
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentMap) return;

        // Remove existing grid lines
        const existingGrid = canvas.getObjects().filter(obj => isGridObject(obj));
        existingGrid.forEach(obj => canvas.remove(obj));

        if (!showGrid) {
            canvas.requestRenderAll();
            return;
        }

        const gridSize = DEFAULT_GRID_SIZE;
        const width = currentMap.imageSize.width;
        const height = currentMap.imageSize.height;

        // Create grid lines
        for (let x = 0; x <= width; x += gridSize) {
            const line = new fabric.Line([x, 0, x, height], {
                stroke: '#d1d5db',
                strokeWidth: x % (gridSize * 5) === 0 ? 1 : 0.5,
                selectable: false,
                evented: false,
                data: { isGrid: true },
            });
            canvas.add(line);
            canvas.sendObjectToBack(line);
        }

        for (let y = 0; y <= height; y += gridSize) {
            const line = new fabric.Line([0, y, width, y], {
                stroke: '#d1d5db',
                strokeWidth: y % (gridSize * 5) === 0 ? 1 : 0.5,
                selectable: false,
                evented: false,
                data: { isGrid: true },
            });
            canvas.add(line);
            canvas.sendObjectToBack(line);
        }

        // Keep background at the back
        const bg = canvas.getObjects().find(obj => {
            return !isGridObject(obj) && !getModuleId(obj);
        });
        if (bg) {
            canvas.sendObjectToBack(bg);
        }

        canvas.requestRenderAll();
    }, [showGrid, currentMap, containerReady]);

    // Snap to grid during movement
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleSnapToGrid = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!snapToGrid || !e.target) return;

            const gridSize = DEFAULT_GRID_SIZE;
            const obj = e.target;
            obj.set({
                left: Math.round((obj.left || 0) / gridSize) * gridSize,
                top: Math.round((obj.top || 0) / gridSize) * gridSize,
            });
        };

        canvas.on('object:moving', handleSnapToGrid);

        return () => {
            canvas.off('object:moving', handleSnapToGrid);
        };
    }, [snapToGrid]);

    /**
     * Save handler for the current map
     * TODO: Implement actual save functionality
     */
    const handleSave = useCallback(async () => {
        // TODO: Implement actual save functionality
        // console.log('Save map:', currentMap);
    }, []);

    /**
     * Zoom in by ZOOM_STEP
     * Clamps zoom to MAX_ZOOM
     */
    const handleZoomIn = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newZoom = Math.min(MAX_ZOOM, canvas.getZoom() + ZOOM_STEP);
        canvas.setZoom(newZoom);
        setZoom(newZoom);
    }, []);

    /**
     * Zoom out by ZOOM_STEP
     * Clamps zoom to MIN_ZOOM
     * Disables pan mode if zoom goes below 1
     */
    const handleZoomOut = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newZoom = Math.max(MIN_ZOOM, canvas.getZoom() - ZOOM_STEP);
        canvas.setZoom(newZoom);
        setZoom(newZoom);
        if (newZoom < 1) {
            setIsPanMode(false);
        }
    }, []);

    /**
     * Fit the entire map to screen with FIT_TO_SCREEN_PADDING padding
     * Disables pan mode if resulting zoom is below 1
     */
    const handleFitToScreen = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentMap || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const mapWidth = currentMap.imageSize.width;
        const mapHeight = currentMap.imageSize.height;

        const scaleX = containerWidth / mapWidth;
        const scaleY = containerHeight / mapHeight;
        const newZoom = Math.min(scaleX, scaleY) * FIT_TO_SCREEN_PADDING;

        canvas.setZoom(newZoom);
        canvas.setViewportTransform([newZoom, 0, 0, newZoom, 0, 0]);
        setZoom(newZoom);
        if (newZoom < 1) {
            setIsPanMode(false);
        }
        canvas.requestRenderAll();
    }, [currentMap]);

    // Toggle Full Screen and Fit to Screen
    const handleToggleFullScreen = useCallback(async () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            try {
                await containerRef.current.requestFullscreen();
                // We'll handle the resize via the already registered window resize listener
                // but we might want to force a fit-to-screen after a short delay to allow transition
                setTimeout(handleFitToScreen, 100);
            } catch (err) {
                console.error("Error attempting to enable full-screen mode:", err);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        }
    }, [handleFitToScreen]);


    /**
     * Navigate back to maps list or dashboard
     * Shows confirmation dialog if there are unsaved changes
     */
    const handleBack = useCallback(() => {
        const backPath = location.pathname.includes('/admin/') ? '/admin/maps' : '/dashboard';

        if (isDirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate(backPath);
            }
        } else {
            navigate(backPath);
        }
    }, [isDirty, navigate, location.pathname]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undoRef.current?.();
            } else if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redoRef.current?.();
            } else if (isCtrl && e.key === 's') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'g') {
                setShowGrid(prev => !prev);
            } else if (e.key === 'Escape') {
                canvasRef.current?.discardActiveObject();
                canvasRef.current?.requestRenderAll();
                setShowExportDialog(false);
            } else if (e.key === 'a' && isCtrl) {
                e.preventDefault();
                const canvas = canvasRef.current;
                if (canvas) {
                    const objects = canvas.getObjects().filter(obj => getModuleId(obj) !== null);
                    const selection = new fabric.ActiveSelection(objects, { canvas });
                    canvas.setActiveObject(selection);
                    canvas.requestRenderAll();
                }
            } else if (e.key === 'f') {
                handleToggleFullScreen();
            } else if (e.key === 'h' && zoom >= 1) {
                setIsPanMode(prev => !prev);
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn();
            } else if (e.key === '-') {
                handleZoomOut();
            } else if (e.key === 's' && !isCtrl) {
                setSnapToGrid(prev => !prev);
            } else if (e.key === 'r') {
                // Toggle rulers
                setShowRulers(prev => !prev);
            } else if (e.key === 'l') {
                // Toggle layers panel
                setShowLayersPanel(prev => !prev);
            } else if (e.key === 'p' && !isCtrl) {
                // Toggle properties panel
                setShowPropertiesPanel(prev => !prev);
            } else if (isCtrl && e.key === 'c') {
                // Copy selected modules
                e.preventDefault();
                const canvas = canvasRef.current;
                if (canvas && selectedIds.length > 0) {
                    const modules = selectedIds
                        .map(id => getModule(id))
                        .filter((m): m is AnyModule => m !== undefined);
                    if (modules.length > 0) {
                        copyToClipboard(modules);
                    }
                }
            } else if (isCtrl && e.key === 'x') {
                // Cut selected modules
                e.preventDefault();
                const canvas = canvasRef.current;
                const executeCommand = executeCommandRef.current;
                if (canvas && selectedIds.length > 0 && executeCommand) {
                    const modules = selectedIds
                        .map(id => getModule(id))
                        .filter((m): m is AnyModule => m !== undefined);
                    if (modules.length > 0) {
                        cutToClipboard(modules);
                        executeCommand(new DeleteCommand(modules));
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                    }
                }
            } else if (isCtrl && e.key === 'v') {
                // Paste modules from clipboard
                e.preventDefault();
                const executeCommand = executeCommandRef.current;
                if (clipboard.length > 0 && executeCommand) {
                    // Create new modules with new IDs and offset positions
                    const newModules: AnyModule[] = clipboard.map(m => ({
                        ...structuredClone(m),
                        id: crypto.randomUUID(),
                        position: {
                            x: m.position.x + clipboardOffset.x,
                            y: m.position.y + clipboardOffset.y,
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }));
                    executeCommand(new AddCommand(newModules));
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                // Delete selected modules
                e.preventDefault();
                const canvas = canvasRef.current;
                const executeCommand = executeCommandRef.current;
                if (canvas && selectedIds.length > 0 && executeCommand) {
                    const modules = selectedIds
                        .map(id => getModule(id))
                        .filter((m): m is AnyModule => m !== undefined);
                    if (modules.length > 0) {
                        executeCommand(new DeleteCommand(modules));
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                    }
                }
            } else if (e.key === 'e' && isCtrl) {
                // Open export dialog
                e.preventDefault();
                setShowExportDialog(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // Note: executeCommandRef, redoRef, and undoRef are refs that don't need to be in dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleSave, zoom, handleZoomIn, handleZoomOut, handleToggleFullScreen, selectedIds, getModule, clipboard, clipboardOffset, copyToClipboard, cutToClipboard]);

    /**
     * Handle drag over event for module drop
     * Prevents default to allow drop
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    /**
     * Handle drop event for adding modules from toolbox
     * Creates a new module at the drop position
     */
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/x-module-type');

        // Validate module type
        const validModuleTypes: ModuleType[] = [
            'campsite', 'toilet', 'storage', 'building', 'parking',
            'road', 'water_source', 'electricity', 'waste_disposal',
            'recreation', 'custom'
        ];

        if (!type || !validModuleTypes.includes(type as ModuleType)) {
            console.warn('[MapEditor] Invalid module type in drop:', type);
            return;
        }

        if (canvasRef.current && containerRef.current) {
            try {
                const canvas = canvasRef.current;
                const pointer = canvas.getPointer(e.nativeEvent);

                const newModule = createNewModule(
                    type as ModuleType,
                    { x: pointer.x, y: pointer.y }
                );

                const executeCommand = executeCommandRef.current;
                if (executeCommand) {
                    executeCommand(new AddCommand([newModule]));
                } else {
                    console.warn('[MapEditor] executeCommand not available in handleDrop');
                }

                // Fix: Clear moduleToAdd after successful drop to prevent click-to-add after drag
                // This ensures drag-and-drop and click-to-add don't interfere with each other
                setModuleToAdd(null);
            } catch (error) {
                console.error('[MapEditor] Error handling drop:', error);
            }
        }
        // Note: createNewModule is a function from store that doesn't need to be in dependencies
        // executeCommandRef is a ref that doesn't need to be in dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setModuleToAdd]);

    // Show loader when:
    // 1. isLoading is true (explicitly loading)
    // 2. We have an id but no currentMap yet (initial load state - the load effect will handle it)
    const shouldShowLoader = isLoading || (id && (!currentMap || currentMap.id !== id));

    if (shouldShowLoader) {
        return <PageLoader />;
    }

    if (!id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">No map ID provided</p>
                    <button
                        onClick={() => navigate('/admin/maps')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Maps
                    </button>
                </div>
            </div>
        );
    }

    if (!currentMap) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Map not found</p>
                    <button
                        onClick={() => navigate('/admin/maps')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Maps
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Left: Back + Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currentMap?.name ?? 'Loading...'}
                        </h1>
                        {isDirty && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                </div>

                {/* Center: Tools */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <Tooltip content="Undo (Ctrl+Z)" placement="bottom">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Redo (Ctrl+Y)" placement="bottom">
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y)"
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    <Tooltip content="Zoom Out (-)" placement="bottom">
                        <button
                            onClick={handleZoomOut}
                            title="Zoom Out (-)"
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <span className="px-2 text-sm font-medium min-w-[60px] text-center text-gray-700 dark:text-gray-200">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Tooltip content="Zoom In (+)" placement="bottom">
                        <button
                            onClick={handleZoomIn}
                            title="Zoom In (+)"
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Full Screen (F)" placement="bottom">
                        <button
                            onClick={handleToggleFullScreen}
                            title="Full Screen (F)"
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content={zoom >= 1 ? `Pan Mode (H) - ${isPanMode ? 'On' : 'Off'}` : 'Pan Mode (zoom in to enable)'} placement="bottom">
                        <button
                            onClick={() => setIsPanMode(!isPanMode)}
                            disabled={zoom < 1}
                            title={zoom >= 1 ? `Pan Mode (H) - ${isPanMode ? 'On' : 'Off'}` : 'Pan Mode (zoom in to enable)'}
                            className={`p-2 rounded-md transition-colors ${isPanMode && zoom >= 1
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                        >
                            <Hand className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    <Tooltip content={`Toggle Grid (G) - ${showGrid ? 'On' : 'Off'}`} placement="bottom">
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            title={`Toggle Grid (G) - ${showGrid ? 'On' : 'Off'}`}
                            className={`p-2 rounded-md transition-colors ${showGrid
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                }`}>
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content={`Snap to Grid (S) - ${snapToGrid ? 'On' : 'Off'}`} placement="bottom">
                        <button
                            onClick={() => setSnapToGrid(!snapToGrid)}
                            title={`Snap to Grid (S) - ${snapToGrid ? 'On' : 'Off'}`}
                            className={`p-2 rounded-md transition-colors ${snapToGrid
                                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                }`}>
                            <Magnet className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content={`Toggle Rulers (R) - ${showRulers ? 'On' : 'Off'}`} placement="bottom">
                        <button
                            onClick={() => setShowRulers(!showRulers)}
                            title={`Toggle Rulers (R) - ${showRulers ? 'On' : 'Off'}`}
                            className={`p-2 rounded-md transition-colors ${showRulers
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                }`}>
                            <Ruler className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    <Tooltip content={`Layers Panel - ${showLayersPanel ? 'On' : 'Off'}`} placement="bottom">
                        <button
                            onClick={() => setShowLayersPanel(!showLayersPanel)}
                            title={`Layers Panel - ${showLayersPanel ? 'On' : 'Off'}`}
                            className={`p-2 rounded-md transition-colors ${showLayersPanel
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                }`}>
                            <Layers className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content={`Properties Panel - ${showPropertiesPanel ? 'On' : 'Off'}`} placement="bottom">
                        <button
                            onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                            title={`Properties Panel - ${showPropertiesPanel ? 'On' : 'Off'}`}
                            className={`p-2 rounded-md transition-colors ${showPropertiesPanel
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                                : 'hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                }`}>
                            <Settings className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Export Map" placement="bottom">
                        <button
                            onClick={() => setShowExportDialog(true)}
                            title="Export Map"
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200">
                            <Download className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>

                {/* Right: Save */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Module Toolbox (left side) */}
                {showToolbox && (
                    <ModuleToolbox />
                )}

                {/* Canvas Container with Rulers */}
                <div className="flex-1 relative overflow-hidden">
                    {showRulers && containerRef.current && (
                        <Rulers
                            canvasWidth={containerRef.current.offsetWidth}
                            canvasHeight={containerRef.current.offsetHeight}
                            zoom={zoom}
                            panX={0}
                            panY={0}
                        />
                    )}

                    {/* Alignment Toolbar (appears when multi-select) */}
                    {selectedCount >= 2 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
                            <AlignmentToolbar executeCommand={executeCommand} />
                        </div>
                    )}

                    <div
                        ref={containerRefCallback}
                        className={`w-full h-full overflow-hidden ${showRulers ? 'ml-5 mt-5' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <canvas id="map-canvas" ref={htmlCanvasRef} />
                    </div>
                </div>

                {/* Right-side panels */}
                {showLayersPanel && (
                    <LayersPanel onClose={() => setShowLayersPanel(false)} />
                )}

                {/* Properties Panel with Tab */}
                {selectedCount > 0 && (
                    showPropertiesPanel ? (
                        <PropertiesPanel
                            onClose={() => setShowPropertiesPanel(false)}
                            executeCommand={executeCommand}
                        />
                    ) : (
                        <button
                            className="properties-panel-tab"
                            onClick={() => setShowPropertiesPanel(true)}
                            title="Open Properties Panel"
                        >
                            <Settings size={16} />
                            <span>Properties</span>
                        </button>
                    )
                )}

                {/* Properties Panel when manually opened and no selection */}
                {selectedCount === 0 && showPropertiesPanel && (
                    <PropertiesPanel
                        onClose={() => setShowPropertiesPanel(false)}
                        executeCommand={executeCommand}
                    />
                )}
            </div>

            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                canvasRef={htmlCanvasRef}
            />

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                    <span>Modules: {currentMap?.modules.length ?? 0}</span>
                    <span>Selected: {selectedCount}</span>
                    <span>Grid: {DEFAULT_GRID_SIZE}px</span>
                    <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Zoom: {Math.round(zoom * 100)}%</span>
                    <span>Pan: Alt+Drag</span>
                </div>
            </div>
        </div>
    );
};

export default MapEditor;
