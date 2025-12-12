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
import { createModuleObject, createNewModule, extractModuleChanges, getModuleId, isGridObject } from '@/utils/moduleFactory';
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
    const [showToolbox, _setShowToolbox] = useState(true);
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showRulers, setShowRulers] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);

    // Ref to the HTML canvas element for export
    const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
                console.log('[MapEditor] Successfully customized rotation handle color');
            } else {
                console.warn('[MapEditor] Could not find defaultControls.mtr - controls:', defaultControls);
            }
        } catch (error) {
            console.error('[MapEditor] Error customizing rotation control:', error);
        }

        canvasRef.current = canvas;

        // Handle selection changes - sync with editorStore
        const syncSelection = () => {
            const activeObjects = canvas.getActiveObjects();
            const ids = activeObjects
                .map(obj => getModuleId(obj))
                .filter((id): id is string => id !== null);
            setSelection(ids);
            setSelectedCount(ids.length);
        };

        canvas.on('selection:created', syncSelection);
        canvas.on('selection:updated', syncSelection);
        canvas.on('selection:cleared', () => {
            setSelection([]);
            setSelectedCount(0);
        });

        // Handle object modification start
        // Bug 1 Fix: Capture transform start state before snap-to-grid modifies position
        // This handler must run before the snap-to-grid handler to capture original position
        const handleTransformStart = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!transformStartRef.current && e.target) {
                const moduleId = getModuleId(e.target);
                if (moduleId) {
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

        canvas.on('object:scaling', (e) => {
            if (!transformStartRef.current && e.target) {
                const moduleId = getModuleId(e.target);
                if (moduleId) {
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        });

        canvas.on('object:rotating', (e) => {
            if (!transformStartRef.current && e.target) {
                const moduleId = getModuleId(e.target);
                if (moduleId) {
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        });

        // Handle object modification end
        canvas.on('object:modified', (e) => {
            if (!e.target || !transformStartRef.current) return;

            const moduleId = getModuleId(e.target);
            if (!moduleId) return;

            const startState = transformStartRef.current;
            const changes = extractModuleChanges(e.target as fabric.Group);

            // Use ref to access latest executeCommand function
            const executeCommand = executeCommandRef.current;

            if (!executeCommand) return;

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
        });

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
            canvas.dispose();
            canvasRef.current = null;
        };
    }, [containerReady]);

    // Handle mouse wheel zoom
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (opt: fabric.TPointerEventInfo<WheelEvent>) => {
            const event = opt.e;
            event.preventDefault();

            const delta = event.deltaY;
            let newZoom = canvas.getZoom() * (delta > 0 ? 0.9 : 1.1);
            newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

            const pointer = canvas.getViewportPoint(event);
            canvas.zoomToPoint(pointer, newZoom);
            setZoom(newZoom);
            // Auto-disable pan mode when zooming to 100% or below
            if (newZoom <= 1) {
                setIsPanMode(false);
            }
        };

        canvas.on('mouse:wheel', handleWheel);

        return () => {
            canvas.off('mouse:wheel', handleWheel);
        };
    }, []);

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
                const pointer = canvas.getPointer(event);

                const newModule = createNewModule(
                    moduleToAdd,
                    { x: pointer.x, y: pointer.y }
                );

                // Execute Add Command
                if (executeCommandRef.current) {
                    executeCommandRef.current(new AddCommand([newModule]));
                }

                // Reset tool
                setModuleToAdd(null);
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

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [isPanMode, activeTool, moduleToAdd, setModuleToAdd]);

    // Load map data (mock for now)
    useEffect(() => {
        console.log('[MapEditor] Load effect - id:', id, 'currentMap:', currentMap?.id);
        if (!id) {
            console.error('[MapEditor] No map ID provided in route');
            return;
        }

        if (!currentMap || currentMap.id !== id) {
            console.log('[MapEditor] Loading map...');
            setLoading(true);
            // TODO: Replace with actual API call
            const timeoutId = setTimeout(() => {
                console.log('[MapEditor] Setting map data');

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
                console.log('[MapEditor] Map set, stopping loading');
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
        if (!canvas || !currentMap) return;

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
    }, [currentMap, containerReady]);

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

    // Save handler (defined before keyboard shortcuts for dependency order)
    const handleSave = useCallback(async () => {
        console.log('Save map:', currentMap);
    }, [currentMap]);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newZoom = Math.min(MAX_ZOOM, canvas.getZoom() + ZOOM_STEP);
        canvas.setZoom(newZoom);
        setZoom(newZoom);
    }, []);

    const handleZoomOut = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newZoom = Math.max(MIN_ZOOM, canvas.getZoom() - ZOOM_STEP);
        canvas.setZoom(newZoom);
        setZoom(newZoom);
        if (newZoom <= 1) {
            setIsPanMode(false);
        }
    }, []);

    const handleFitToScreen = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentMap || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const mapWidth = currentMap.imageSize.width;
        const mapHeight = currentMap.imageSize.height;

        const scaleX = containerWidth / mapWidth;
        const scaleY = containerHeight / mapHeight;
        const newZoom = Math.min(scaleX, scaleY) * 0.9;

        canvas.setZoom(newZoom);
        canvas.setViewportTransform([newZoom, 0, 0, newZoom, 0, 0]);
        setZoom(newZoom);
        if (newZoom <= 1) {
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


    // Back navigation
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
            } else if (e.key === 'h' && zoom > 1) {
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
                        console.log('[MapEditor] Copied', modules.length, 'module(s)');
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
                        console.log('[MapEditor] Cut', modules.length, 'module(s)');
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
                    console.log('[MapEditor] Pasted', newModules.length, 'module(s)');
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
                        console.log('[MapEditor] Deleted', modules.length, 'module(s)');
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
    }, [handleSave, zoom, handleZoomIn, handleZoomOut, handleToggleFullScreen, selectedIds, getModule, clipboard, clipboardOffset, copyToClipboard, cutToClipboard]);

    // Drag and Drop Handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/x-module-type') as ModuleType | '';

        if (type && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const pointer = canvas.getPointer(e.nativeEvent);

            const newModule = createNewModule(
                type as ModuleType,
                { x: pointer.x, y: pointer.y }
            );

            executeCommandRef.current?.(new AddCommand([newModule]));
        }
    }, [createNewModule, executeCommandRef]);

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
                    <Tooltip content={zoom > 1 ? `Pan Mode (H) - ${isPanMode ? 'On' : 'Off'}` : 'Pan Mode (zoom in to enable)'} placement="bottom">
                        <button
                            onClick={() => setIsPanMode(!isPanMode)}
                            disabled={zoom <= 1}
                            title={zoom > 1 ? `Pan Mode (H) - ${isPanMode ? 'On' : 'Off'}` : 'Pan Mode (zoom in to enable)'}
                            className={`p-2 rounded-md transition-colors ${isPanMode && zoom > 1
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
                {showPropertiesPanel && (
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
