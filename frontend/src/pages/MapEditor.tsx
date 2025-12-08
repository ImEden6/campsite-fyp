/**
 * MapEditor Page
 * Main page component for the campsite map editor.
 * Uses Fabric.js for canvas rendering with pan/zoom controls.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import { ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet } from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { PageLoader } from '@/components/ui/PageLoader';
import { Tooltip } from '@/components/ui/Tooltip';
import { createModuleObject, extractModuleChanges } from '@/utils/moduleFactory';
import { MoveCommand, TransformCommand, type Command } from '@/commands';
import type { AnyModule, Position } from '@/types';

// Constants
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;
const DEFAULT_GRID_SIZE = 20;

// Type helper for accessing custom data on Fabric objects
type FabricObjectWithData = fabric.FabricObject & { data?: { moduleId?: string; moduleType?: string; isGrid?: boolean } };

const MapEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
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

    // History state
    const [undoStack, setUndoStack] = useState<Command[]>([]);
    const [redoStack, setRedoStack] = useState<Command[]>([]);

    // Store state
    const { currentMap, isLoading, isDirty, setMap, setLoading, markDirty, _updateModule } = useMapStore();

    // Execute command and add to history
    const executeCommand = useCallback((command: Command) => {
        command.execute();
        setUndoStack(prev => [...prev, command]);
        setRedoStack([]);
        markDirty();
    }, [markDirty]);

    // Undo
    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        const command = undoStack[undoStack.length - 1]!;
        command.undo();
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, command]);
        markDirty();
    }, [undoStack, markDirty]);

    // Redo
    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const command = redoStack[redoStack.length - 1]!;
        command.execute();
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, command]);
        markDirty();
    }, [redoStack, markDirty]);

    // Initialize canvas
    useEffect(() => {
        if (!containerRef.current || canvasRef.current) return;

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
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#1d4ed8',
            cornerSize: 10,
            transparentCorners: false,
            borderColor: '#3b82f6',
            borderScaleFactor: 2,
        });

        canvasRef.current = canvas;

        // Handle selection changes
        canvas.on('selection:created', () => setSelectedCount(canvas.getActiveObjects().length));
        canvas.on('selection:updated', () => setSelectedCount(canvas.getActiveObjects().length));
        canvas.on('selection:cleared', () => setSelectedCount(0));

        // Handle object modification start
        canvas.on('object:moving', (e) => {
            if (!transformStartRef.current && e.target) {
                const data = (e.target as FabricObjectWithData).data;
                if (data?.moduleId) {
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: data.moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        });

        canvas.on('object:scaling', (e) => {
            if (!transformStartRef.current && e.target) {
                const data = (e.target as FabricObjectWithData).data;
                if (data?.moduleId) {
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: data.moduleId,
                        position: changes.position,
                        size: changes.size,
                        rotation: changes.rotation,
                    };
                }
            }
        });

        canvas.on('object:rotating', (e) => {
            if (!transformStartRef.current && e.target) {
                const data = (e.target as FabricObjectWithData).data;
                if (data?.moduleId) {
                    const changes = extractModuleChanges(e.target as fabric.Group);
                    transformStartRef.current = {
                        id: data.moduleId,
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

            const data = (e.target as FabricObjectWithData).data;
            if (!data?.moduleId) return;

            const startState = transformStartRef.current;
            const changes = extractModuleChanges(e.target as fabric.Group);

            // Check if it was just a move or a full transform
            const sizeChanged =
                startState.size.width !== changes.size.width ||
                startState.size.height !== changes.size.height;
            const rotationChanged = startState.rotation !== changes.rotation;

            if (sizeChanged || rotationChanged) {
                // Use TransformCommand for resize/rotate
                executeCommand(new TransformCommand({
                    id: data.moduleId,
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
                    id: data.moduleId,
                    oldPosition: startState.position,
                    newPosition: changes.position,
                }]));
            }

            // Update the store
            _updateModule(data.moduleId, {
                position: changes.position,
                size: changes.size,
                rotation: changes.rotation,
            });

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
    }, [executeCommand, _updateModule]);

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
        };

        canvas.on('mouse:wheel', handleWheel);

        return () => {
            canvas.off('mouse:wheel', handleWheel);
        };
    }, []);

    // Handle pan with alt+drag or middle mouse
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let isPanning = false;
        let lastPosX = 0;
        let lastPosY = 0;

        const handleMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
            const event = opt.e as MouseEvent;
            if ('altKey' in event && (event.altKey || event.button === 1)) {
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
            canvas.selection = true;
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, []);

    // Load map data (mock for now)
    useEffect(() => {
        console.log('[MapEditor] Load effect - id:', id, 'currentMap:', currentMap?.id);
        if (id && !currentMap) {
            console.log('[MapEditor] Loading map...');
            setLoading(true);
            // TODO: Replace with actual API call
            setTimeout(() => {
                console.log('[MapEditor] Setting map data');
                setMap({
                    id,
                    name: 'Sample Campsite',
                    description: 'A sample campsite map',
                    imageUrl: '',
                    imageSize: { width: 1920, height: 1080 },
                    scale: 10,
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
                console.log('[MapEditor] Map set, stopping loading');
                setLoading(false);
            }, 500);
        }
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
    }, [currentMap]);

    // Draw grid
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentMap) return;

        // Remove existing grid lines
        const existingGrid = canvas.getObjects().filter(obj => (obj as FabricObjectWithData).data?.isGrid);
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
            const data = (obj as FabricObjectWithData).data;
            return !data?.isGrid && !data?.moduleId;
        });
        if (bg) {
            canvas.sendObjectToBack(bg);
        }

        canvas.requestRenderAll();
    }, [showGrid, currentMap]);

    // Snap to grid during movement
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMoving = (e: fabric.BasicTransformEvent & { target: fabric.FabricObject }) => {
            if (!snapToGrid || !e.target) return;
            const gridSize = DEFAULT_GRID_SIZE;
            const obj = e.target;
            obj.set({
                left: Math.round((obj.left || 0) / gridSize) * gridSize,
                top: Math.round((obj.top || 0) / gridSize) * gridSize,
            });
        };

        canvas.on('object:moving', handleMoving);

        return () => {
            canvas.off('object:moving', handleMoving);
        };
    }, [snapToGrid]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            } else if (isCtrl && e.key === 's') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'g') {
                setShowGrid(prev => !prev);
            } else if (e.key === 'Escape') {
                canvasRef.current?.discardActiveObject();
                canvasRef.current?.requestRenderAll();
            } else if (e.key === 'a' && isCtrl) {
                e.preventDefault();
                const canvas = canvasRef.current;
                if (canvas) {
                    const objects = canvas.getObjects().filter(obj => (obj as FabricObjectWithData).data?.moduleId);
                    const selection = new fabric.ActiveSelection(objects, { canvas });
                    canvas.setActiveObject(selection);
                    canvas.requestRenderAll();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

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
        canvas.requestRenderAll();
    }, [currentMap]);

    // Save handler
    const handleSave = useCallback(async () => {
        console.log('Save map:', currentMap);
    }, [currentMap]);

    // Back navigation
    const handleBack = useCallback(() => {
        if (isDirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    }, [isDirty, navigate]);

    if (isLoading) {
        return <PageLoader />;
    }

    if (!currentMap) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Map not found</p>
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
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currentMap.name}
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
                    <Tooltip content="Undo (Ctrl+Z)">
                        <button
                            onClick={undo}
                            disabled={undoStack.length === 0}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Redo (Ctrl+Y)">
                        <button
                            onClick={redo}
                            disabled={redoStack.length === 0}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    <Tooltip content="Zoom Out">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <span className="px-2 text-sm font-medium min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Tooltip content="Zoom In">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Fit to Screen">
                        <button
                            onClick={handleFitToScreen}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    <Tooltip content={`Toggle Grid (G) - ${showGrid ? 'On' : 'Off'}`}>
                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            className={`p-2 rounded-md transition-colors ${showGrid
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-white dark:hover:bg-gray-600'
                                }`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content={`Snap to Grid - ${snapToGrid ? 'On' : 'Off'}`}>
                        <button
                            onClick={() => setSnapToGrid(!snapToGrid)}
                            className={`p-2 rounded-md transition-colors ${snapToGrid
                                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                : 'hover:bg-white dark:hover:bg-gray-600'
                                }`}
                        >
                            <Magnet className="w-4 h-4" />
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

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden"
            >
                <canvas id="map-canvas" />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                    <span>Modules: {currentMap.modules.length}</span>
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
