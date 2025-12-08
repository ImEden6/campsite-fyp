/**
 * MapEditor Page
 * Main page component for the campsite map editor.
 * Uses Konva for canvas rendering with pan/zoom controls.
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet } from 'lucide-react';
import { useMapStore, useEditorStore, useViewportStore, VIEWPORT_CONSTANTS } from '@/stores';
import { PageLoader } from '@/components/ui/PageLoader';
import { Tooltip } from '@/components/ui/Tooltip';
import { MapGrid } from '@/components/MapGrid';
import { ModuleRenderer } from '@/components/ModuleRenderer';
import { TransformHandles } from '@/components/TransformHandles';
import { MoveCommand } from '@/commands/MoveCommand';
import { ResizeCommand } from '@/commands/ResizeCommand';
import { RotateCommand } from '@/commands/RotateCommand';
import { snapToGrid as snapPositionToGrid } from '@/utils/transformUtils';
import type { Position, Size, AnyModule } from '@/types';

const MapEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);

    // Drag state refs
    const dragStartPositions = useRef<Map<string, Position>>(new Map());

    // Local state
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [transformState, setTransformState] = useState<{
        type: 'resize' | 'rotate' | null;
        startPosition?: Position;
        startSize?: Size;
        startRotation?: number;
    }>({ type: null });

    // Store state
    const { currentMap, isLoading, isDirty, setMap, setLoading, getModule } = useMapStore();
    const {
        selectedIds,
        select,
        clearSelection,
        toggleSelection,
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
        canUndo,
        canRedo,
        undo,
        redo,
        execute,
    } = useEditorStore();
    const {
        zoom,
        position,
        setZoom,
        zoomIn,
        zoomOut,
        setPosition,
        fitToScreen,
        reset: resetViewport
    } = useViewportStore();

    // Get selected module (for single-select transforms)
    const selectedModule = useMemo(() => {
        if (selectedIds.length === 1) {
            return getModule(selectedIds[0]!);
        }
        return undefined;
    }, [selectedIds, getModule]);

    // Handle container resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Load map data (mock for now)
    useEffect(() => {
        if (id && !currentMap) {
            setLoading(true);
            // TODO: Replace with actual API call
            // For now, create a mock map with sample modules
            setTimeout(() => {
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
                setLoading(false);
            }, 500);
        }
    }, [id, currentMap, setMap, setLoading]);

    // Handle wheel zoom
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const scaleBy = 1.1;
        const oldZoom = zoom;
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - position.x) / oldZoom,
            y: (pointer.y - position.y) / oldZoom,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newZoom = direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
        const clampedZoom = Math.max(
            VIEWPORT_CONSTANTS.MIN_ZOOM,
            Math.min(VIEWPORT_CONSTANTS.MAX_ZOOM, newZoom)
        );

        setZoom(clampedZoom);
        setPosition({
            x: pointer.x - mousePointTo.x * clampedZoom,
            y: pointer.y - mousePointTo.y * clampedZoom,
        });
    }, [zoom, position, setZoom, setPosition]);

    // Handle stage drag for panning
    const handleStageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
            setPosition({
                x: e.target.x(),
                y: e.target.y(),
            });
        }
    }, [setPosition]);

    // Handle click on empty area to clear selection
    const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        // Only clear selection if clicking on the stage background
        if (e.target === stageRef.current) {
            clearSelection();
        }
    }, [clearSelection]);

    // Module selection handler
    const handleModuleSelect = useCallback((moduleId: string, additive: boolean) => {
        if (additive) {
            toggleSelection(moduleId);
        } else {
            select([moduleId]);
        }
    }, [select, toggleSelection]);

    // Module drag start - capture all selected module positions
    const handleModuleDragStart = useCallback((moduleId: string, startPos: Position) => {
        // If the dragged module is not selected, select it
        if (!selectedIds.includes(moduleId)) {
            select([moduleId]);
        }

        // Capture start positions for all selected modules
        dragStartPositions.current.clear();
        const modules = currentMap?.modules ?? [];
        const idsToCapture = selectedIds.includes(moduleId) ? selectedIds : [moduleId];

        idsToCapture.forEach(id => {
            const module = modules.find(m => m.id === id);
            if (module) {
                dragStartPositions.current.set(id, { ...module.position });
            }
        });
    }, [selectedIds, select, currentMap?.modules]);

    // Module drag move - apply grid snapping if enabled
    const handleModuleDragMove = useCallback((moduleId: string, currentPos: Position) => {
        if (snapToGrid) {
            const stage = stageRef.current;
            const node = stage?.findOne(`#${moduleId}`);
            if (node) {
                const snappedPos = snapPositionToGrid(currentPos, gridSize);
                node.position(snappedPos);
            }
        }
    }, [snapToGrid, gridSize]);

    // Module drag end - execute move command
    const handleModuleDragEnd = useCallback((moduleId: string, finalPos: Position) => {
        const startPositions = dragStartPositions.current;
        if (startPositions.size === 0) return;

        // Build move data for command
        const moves: { id: string; oldPosition: Position; newPosition: Position }[] = [];

        // Calculate the delta from the dragged module
        const draggedStartPos = startPositions.get(moduleId);
        if (!draggedStartPos) return;

        let finalPosition = finalPos;
        if (snapToGrid) {
            finalPosition = snapPositionToGrid(finalPos, gridSize);
        }

        const deltaX = finalPosition.x - draggedStartPos.x;
        const deltaY = finalPosition.y - draggedStartPos.y;

        // Skip if no actual movement
        if (deltaX === 0 && deltaY === 0) {
            dragStartPositions.current.clear();
            return;
        }

        // Apply delta to all captured modules
        startPositions.forEach((startPos, id) => {
            let newPos = {
                x: startPos.x + deltaX,
                y: startPos.y + deltaY,
            };
            if (snapToGrid) {
                newPos = snapPositionToGrid(newPos, gridSize);
            }
            moves.push({
                id,
                oldPosition: startPos,
                newPosition: newPos,
            });
        });

        // Execute move command
        if (moves.length > 0) {
            execute(new MoveCommand(moves));
        }

        dragStartPositions.current.clear();
    }, [snapToGrid, gridSize, execute]);

    // Transform handlers for single selection
    const handleResizeStart = useCallback(() => {
        if (!selectedModule) return;
        setTransformState({
            type: 'resize',
            startPosition: { ...selectedModule.position },
            startSize: { ...selectedModule.size },
        });
    }, [selectedModule]);

    const handleResize = useCallback((newPosition: Position, newSize: Size) => {
        if (!selectedModule) return;
        // Update module position and size directly for visual feedback
        useMapStore.getState()._updateModule(selectedModule.id, {
            position: newPosition,
            size: newSize,
        });
    }, [selectedModule]);

    const handleResizeEnd = useCallback((newPosition: Position, newSize: Size) => {
        if (!selectedModule || !transformState.startPosition || !transformState.startSize) return;

        execute(new ResizeCommand({
            id: selectedModule.id,
            oldPosition: transformState.startPosition,
            oldSize: transformState.startSize,
            newPosition,
            newSize,
        }));

        setTransformState({ type: null });
    }, [selectedModule, transformState, execute]);

    const handleRotateStart = useCallback(() => {
        if (!selectedModule) return;
        setTransformState({
            type: 'rotate',
            startRotation: selectedModule.rotation,
        });
    }, [selectedModule]);

    const handleRotate = useCallback((angle: number) => {
        if (!selectedModule) return;
        // Update module rotation directly for visual feedback
        useMapStore.getState()._updateModule(selectedModule.id, {
            rotation: angle,
        });
    }, [selectedModule]);

    const handleRotateEnd = useCallback((angle: number) => {
        if (!selectedModule || transformState.startRotation === undefined) return;

        execute(new RotateCommand({
            id: selectedModule.id,
            oldRotation: transformState.startRotation,
            newRotation: angle,
        }));

        setTransformState({ type: null });
    }, [selectedModule, transformState, execute]);

    // Fit to screen
    const handleFitToScreen = useCallback(() => {
        if (currentMap && dimensions.width && dimensions.height) {
            fitToScreen(currentMap.imageSize, dimensions);
        }
    }, [currentMap, dimensions, fitToScreen]);

    // Handle save
    const handleSave = useCallback(async () => {
        // TODO: Implement save functionality
        console.log('Save map:', currentMap);
    }, [currentMap]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        if (isDirty) {
            // TODO: Show confirmation dialog
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate(-1);
            }
        } else {
            navigate(-1);
        }
    }, [isDirty, navigate]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo()) undo();
            } else if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo()) redo();
            } else if (isCtrl && e.key === 's') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'g') {
                toggleGrid();
            } else if (e.key === '0' && isCtrl) {
                e.preventDefault();
                resetViewport();
            } else if (e.key === '1' && isCtrl) {
                e.preventDefault();
                handleFitToScreen();
            } else if (e.key === 'Escape') {
                clearSelection();
            } else if (e.key === 'a' && isCtrl) {
                e.preventDefault();
                useEditorStore.getState().selectAll();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo, handleSave, toggleGrid, resetViewport, handleFitToScreen, clearSelection]);

    // Sort modules by zIndex for rendering
    const sortedModules = useMemo(() => {
        if (!currentMap) return [];
        return [...currentMap.modules].sort((a, b) => a.zIndex - b.zIndex);
    }, [currentMap]);

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
                            disabled={!canUndo()}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Redo (Ctrl+Y)">
                        <button
                            onClick={redo}
                            disabled={!canRedo()}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    <Tooltip content="Zoom Out">
                        <button
                            onClick={() => zoomOut()}
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
                            onClick={() => zoomIn()}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Fit to Screen (Ctrl+1)">
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
                            onClick={toggleGrid}
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
                            onClick={toggleSnapToGrid}
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
                className="flex-1 overflow-hidden bg-gray-200 dark:bg-gray-800"
            >
                <Stage
                    ref={stageRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    scaleX={zoom}
                    scaleY={zoom}
                    x={position.x}
                    y={position.y}
                    draggable
                    onWheel={handleWheel}
                    onDragEnd={handleStageDragEnd}
                    onClick={handleStageClick}
                    onTap={handleStageClick}
                >
                    {/* Background Layer */}
                    <Layer listening={false}>
                        {/* Map canvas background */}
                        <Rect
                            x={0}
                            y={0}
                            width={currentMap.imageSize.width}
                            height={currentMap.imageSize.height}
                            fill="#f8f9fa"
                            stroke="#dee2e6"
                            strokeWidth={2}
                            listening={false}
                        />
                    </Layer>

                    {/* Grid Layer */}
                    {showGrid && (
                        <Layer listening={false}>
                            <MapGrid
                                width={dimensions.width}
                                height={dimensions.height}
                                gridSize={gridSize}
                                zoom={zoom}
                                offset={position}
                            />
                        </Layer>
                    )}

                    {/* Modules Layer */}
                    <Layer>
                        {sortedModules.map((module) => (
                            <ModuleRenderer
                                key={module.id}
                                module={module}
                                isSelected={selectedIds.includes(module.id)}
                                onSelect={handleModuleSelect}
                                onDragStart={handleModuleDragStart}
                                onDragMove={handleModuleDragMove}
                                onDragEnd={handleModuleDragEnd}
                            />
                        ))}
                    </Layer>

                    {/* Transform Handles Layer */}
                    <Layer>
                        {selectedModule && (
                            <TransformHandles
                                position={selectedModule.position}
                                size={selectedModule.size}
                                rotation={selectedModule.rotation}
                                snapToGrid={snapToGrid}
                                gridSize={gridSize}
                                onResizeStart={handleResizeStart}
                                onResize={handleResize}
                                onResizeEnd={handleResizeEnd}
                                onRotateStart={handleRotateStart}
                                onRotate={handleRotate}
                                onRotateEnd={handleRotateEnd}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                    <span>Modules: {currentMap.modules.length}</span>
                    <span>Selected: {selectedIds.length}</span>
                    <span>Grid: {gridSize}px</span>
                    <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Zoom: {Math.round(zoom * 100)}%</span>
                    <span>
                        Position: {Math.round(position.x)}, {Math.round(position.y)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MapEditor;
