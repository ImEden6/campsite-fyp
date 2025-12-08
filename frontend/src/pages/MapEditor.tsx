/**
 * MapEditor Page
 * Main page component for the campsite map editor.
 * Uses Konva for canvas rendering with pan/zoom controls.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet } from 'lucide-react';
import { useMapStore, useEditorStore, useViewportStore, VIEWPORT_CONSTANTS } from '@/stores';
import { PageLoader } from '@/components/ui/PageLoader';
import { Tooltip } from '@/components/ui/Tooltip';
import { MapGrid } from '@/components/MapGrid';

const MapEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);

    // Local state
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Store state
    const { currentMap, isLoading, isDirty, setMap, setLoading } = useMapStore();
    const {
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
        canUndo,
        canRedo,
        undo,
        redo,
        clearSelection
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
            // For now, create a mock map
            setTimeout(() => {
                setMap({
                    id,
                    name: 'Sample Campsite',
                    description: 'A sample campsite map',
                    imageUrl: '',
                    imageSize: { width: 1920, height: 1080 },
                    scale: 10,
                    bounds: { minX: 0, minY: 0, maxX: 1920, maxY: 1080 },
                    modules: [],
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
    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo, handleSave, toggleGrid, resetViewport, handleFitToScreen]);

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
                    onDragEnd={handleDragEnd}
                    onClick={handleStageClick}
                    onTap={handleStageClick}
                >
                    {/* Background Layer */}
                    <Layer>
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
                        {/* TODO: Add ModuleRenderer components */}
                    </Layer>

                    {/* Selection Layer */}
                    <Layer>
                        {/* TODO: Add selection handles */}
                    </Layer>
                </Stage>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                    <span>Modules: {currentMap.modules.length}</span>
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
