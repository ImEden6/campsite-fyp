import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
    Grid3X3, Magnet, Hand, Layers, Settings, Download, Ruler,
    Image as ImageIcon
} from 'lucide-react';

// Stores
import { useMapStore } from '@/stores/mapStore';
import { useEditorStore } from '@/stores/editorStore';

// Hooks - using new modular hooks
import { useMapEditor, useMapSave } from '@/hooks/editor';

// Components
import { PageLoader } from '@/components/ui/PageLoader';
import { Tooltip } from '@/components/ui/Tooltip';
import {
    ModuleToolbox,
    PropertiesPanel,
    LayersPanel,
    Rulers,
    AlignmentToolbar,
    ExportDialog,
    BackgroundDialog,
} from '@/components/editor';

// Utils
import { createNewModule } from '@/utils/moduleFactory';
import { generateMapFromSites } from '@/utils/generateModulesFromSites';
import { renderBackgroundLayer, removeBackgroundLayer, updateBackgroundLocked } from '@/utils/backgroundLayer';
import { getSites } from '@/services/api/sites';

// Types
import type { ModuleType } from '@/types';

// Constants
const MapEditorRefactored: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Container ref for canvas sizing
    const containerRef = useRef<HTMLDivElement | null>(null);
    const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Panel visibility state
    const [showToolbox] = useState(true);
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showRulers, setShowRulers] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
    const [backgroundLocked] = useState(true);

    // Callback ref for container mounting
    const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
    }, []);

    // Store state
    const { currentMap, isLoading, setMap, setLoading } = useMapStore();
    const { selectedIds } = useEditorStore();

    // ========================================================================
    // USE THE COMPOSITE HOOK
    // ========================================================================
    const {
        isReady,
        error,
        canvasRef,

        // Zoom/Pan
        zoom,
        isPanMode,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,

        // Grid
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,

        // Commands
        undo,
        redo,
        canUndo,
        canRedo,

        // State
        isDirty,
        markDirty,
        clearDirty,
    } = useMapEditor({
        canvasId: 'map-canvas',
        containerRef,
        confirmOnExit: true,
    });

    const selectedCount = selectedIds.length;

    // ========================================================================
    // MAP LOADING
    // ========================================================================
    useEffect(() => {
        const loadMapData = async () => {
            if (!id) {
                navigate('/');
                return;
            }

            setLoading(true);
            try {
                // Check if coming from site management with site data
                const locationState = location.state as { fromSiteManagement?: boolean } | null;

                if (locationState?.fromSiteManagement) {
                    // Generate map from sites API
                    const sites = await getSites();
                    const generatedMap = generateMapFromSites(sites);
                    setMap({
                        ...generatedMap,
                        id,
                        name: 'Site Map',
                    });
                } else {
                    // Load existing map or create new one
                    // For now, create a default empty map
                    setMap({
                        id,
                        name: 'New Map',
                        description: '',
                        imageUrl: '',
                        imageSize: { width: 1000, height: 800 },
                        scale: 1,
                        bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 800 },
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
                }
            } catch (err) {
                console.error('Failed to load map:', err);
            } finally {
                setLoading(false);
            }
        };

        loadMapData();
    }, [id, location.state, navigate, setLoading, setMap]);

    // ========================================================================
    // BACKGROUND LAYER SYNC
    // ========================================================================
    useEffect(() => {
        if (!isReady || !canvasRef.current || !currentMap?.backgroundLayer) return;

        renderBackgroundLayer(canvasRef.current, currentMap.backgroundLayer);
        updateBackgroundLocked(canvasRef.current, backgroundLocked);
    }, [isReady, canvasRef, currentMap?.backgroundLayer, backgroundLocked]);

    // ========================================================================
    // DRAG AND DROP
    // ========================================================================
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!canvasRef.current || !currentMap) return;

        const moduleType = e.dataTransfer.getData('application/module-type') as ModuleType;
        if (!moduleType) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to canvas coordinates
        const canvas = canvasRef.current;
        const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];

        const canvasX = (x - (vpt[4] ?? 0)) / (vpt[0] ?? 1);
        const canvasY = (y - (vpt[5] ?? 0)) / (vpt[3] ?? 1);

        // Create new module
        const newModule = createNewModule(moduleType, { x: canvasX, y: canvasY });
        if (newModule) {
            useMapStore.getState()._addModule(newModule);
            markDirty();
        }
    }, [canvasRef, currentMap, markDirty]);

    // ========================================================================
    // SAVE (using useMutation pattern)
    // ========================================================================
    const { save: handleSave, isSaving } = useMapSave({
        getCurrentMap: () => currentMap,
        onSuccess: () => {
            clearDirty();
            // Import dynamically to avoid circular deps
            import('@/stores/uiStore').then(({ useUIStore }) => {
                useUIStore.getState().showToast('Map saved successfully', 'success');
            });
        },
        onError: (error) => {
            // Structured logging - not console.error in production
            import('@/stores/uiStore').then(({ useUIStore }) => {
                useUIStore.getState().showToast(
                    error.message || 'Failed to save map',
                    'error'
                );
            });
        },
        onMapUpdated: (map, modules) => {
            // Update local state with server response for concurrency
            useMapStore.getState().setMap({ ...map, modules });
        },
    });

    // ========================================================================
    // RENDER
    // ========================================================================
    if (isLoading || !currentMap) {
        return <PageLoader />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-600 dark:text-red-400">
                    Failed to initialize editor: {error.message}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Left: Back + Title */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold">{currentMap.name}</h1>
                    {isDirty && (
                        <span className="text-xs text-amber-500">• Unsaved changes</span>
                    )}
                </div>

                {/* Center: Tools */}
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                    {/* Undo/Redo */}
                    <Tooltip content="Undo (Ctrl+Z)" placement="bottom">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Redo (Ctrl+Y)" placement="bottom">
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Zoom */}
                    <Tooltip content="Zoom Out (Ctrl+-)" placement="bottom">
                        <button onClick={zoomOut} className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <span className="px-2 text-sm font-medium min-w-[4rem] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Tooltip content="Zoom In (Ctrl++)" placement="bottom">
                        <button onClick={zoomIn} className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Fit to Screen (Ctrl+0)" placement="bottom">
                        <button onClick={fitToScreen} className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Grid */}
                    <Tooltip content="Toggle Grid (Ctrl+G)" placement="bottom">
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
                    <Tooltip content="Toggle Snap to Grid" placement="bottom">
                        <button
                            onClick={toggleSnapToGrid}
                            className={`p-2 rounded-md transition-colors ${snapToGrid
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-white dark:hover:bg-gray-600'
                                }`}
                        >
                            <Magnet className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Pan Mode */}
                    <Tooltip content="Pan Mode (Space)" placement="bottom">
                        <button
                            onClick={togglePanMode}
                            className={`p-2 rounded-md transition-colors ${isPanMode
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-white dark:hover:bg-gray-600'
                                }`}
                        >
                            <Hand className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Panels */}
                    <Tooltip content="Toggle Layers Panel" placement="bottom">
                        <button
                            onClick={() => setShowLayersPanel(!showLayersPanel)}
                            className={`p-2 rounded-md transition-colors ${showLayersPanel
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-white dark:hover:bg-gray-600'
                                }`}
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Toggle Rulers" placement="bottom">
                        <button
                            onClick={() => setShowRulers(!showRulers)}
                            className={`p-2 rounded-md transition-colors ${showRulers
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-white dark:hover:bg-gray-600'
                                }`}
                        >
                            <Ruler className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Export */}
                    <Tooltip content="Export Map" placement="bottom">
                        <button
                            onClick={() => setShowExportDialog(true)}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    {/* Background */}
                    <Tooltip content="Background Image" placement="bottom">
                        <button
                            onClick={() => setShowBackgroundDialog(true)}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>

                {/* Right: Save */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Module Toolbox (left side) */}
                {showToolbox && <ModuleToolbox />}

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
                            <AlignmentToolbar executeCommand={() => { }} />
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

                {/* Properties Panel */}
                {selectedCount > 0 && (
                    showPropertiesPanel ? (
                        <PropertiesPanel
                            onClose={() => setShowPropertiesPanel(false)}
                            executeCommand={() => { }}
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
            </div>

            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                canvasRef={htmlCanvasRef}
            />

            {/* Background Dialog */}
            <BackgroundDialog
                isOpen={showBackgroundDialog}
                onClose={() => setShowBackgroundDialog(false)}
                existingLayer={currentMap?.backgroundLayer || undefined}
                onConfirm={(layer, fitBounds) => {
                    if (!canvasRef.current) return;

                    if (!layer) {
                        removeBackgroundLayer(canvasRef.current);
                        if (currentMap) {
                            setMap({ ...currentMap, backgroundLayer: undefined });
                        }
                        return;
                    }

                    renderBackgroundLayer(canvasRef.current, layer);

                    if (currentMap) {
                        const updatedMap = { ...currentMap, backgroundLayer: layer };
                        if (fitBounds) {
                            updatedMap.bounds = {
                                minX: 0,
                                minY: 0,
                                maxX: layer.size.width,
                                maxY: layer.size.height,
                            };
                        }
                        setMap(updatedMap);
                    }

                    markDirty();
                }}
            />

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                    <span>Modules: {currentMap?.modules.length ?? 0}</span>
                    <span>Selected: {selectedCount}</span>
                    <span>Grid: {gridSize}px</span>
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

export default MapEditorRefactored;
