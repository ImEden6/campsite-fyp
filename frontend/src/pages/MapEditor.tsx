import React, { useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { AddCommand } from '@/commands/AddCommand';
import { renderBackgroundLayer, removeBackgroundLayer, updateBackgroundLocked } from '@/utils/backgroundLayer';
import { getMapById } from '@/services/api/maps';
import { ApiException } from '@/services/api/errors';

// Types
import type { AnyModule, BackgroundLayer, CampsiteMap, ModuleType } from '@/types';

/** Toolbar / tool cluster — aligned with Header + IMPECCABLE (nature OKLCH, glass, secondary accents). */
const editorToolbarBar =
    'sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 ' +
    'bg-white/92 dark:bg-night-surface/92 backdrop-blur-md ' +
    'border-b border-secondary-200/70 dark:border-secondary-800/55 ' +
    'shadow-[0_1px_0_rgba(15,23,42,0.05)] dark:shadow-none';

const editorToolCluster =
    'flex items-center gap-0.5 rounded-xl border border-secondary-200/60 dark:border-secondary-800/50 ' +
    'bg-secondary-50/90 dark:bg-night-bg/55 backdrop-blur-sm px-0.5 py-0.5';

const toolBtnBase =
    'p-2 rounded-lg transition-colors duration-200 ' +
    'text-gray-700 dark:text-secondary-300 ' +
    'hover:bg-secondary-100/90 dark:hover:bg-night-surface-alt/85';

const toolBtnActive =
    'p-2 rounded-lg transition-colors duration-200 ' +
    'bg-secondary-200/90 dark:bg-secondary-950/50 ' +
    'text-secondary-900 dark:text-secondary-100 ' +
    'ring-1 ring-inset ring-secondary-400/35 dark:ring-secondary-600/45';

const toolDivider = 'w-px h-6 bg-secondary-300/80 dark:bg-secondary-700/70 mx-0.5';

/**
 * Canvas + Fabric mount only after map data exists so the container ref is in the DOM
 * when useFabricCanvas runs (avoids zero-size / never-initialized canvas).
 */
const MapEditorWorkspace: React.FC = () => {
    const navigate = useNavigate();
    const [hasFitted, setHasFitted] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [showToolbox] = useState(true);
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const showRulers = useEditorStore((s) => s.showRulers);
    const toggleRulers = useEditorStore((s) => s.toggleRulers);
    const [canvasAreaSize, setCanvasAreaSize] = useState({ width: 0, height: 0 });
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
    const [backgroundLocked] = useState(true);

    const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
    }, []);

    const currentMap = useMapStore(state => state.currentMap);
    const mapStoreIsDirty = useMapStore((state) => state.isDirty);
    const mapError = useMapStore(state => state.error);
    const setMap = useMapStore(state => state.setMap);
    const selectedIds = useEditorStore(state => state.selectedIds);

    const saveRef = useRef<() => void>(undefined);
    const editorOptions = useMemo(
        () => ({
            canvasId: 'map-canvas',
            containerRef,
            confirmOnExit: true,
            onSave: () => saveRef.current?.(),
            onModuleContextMenu: () => {
                setShowPropertiesPanel(true);
            },
        }),
        [containerRef]
    );

    const {
        isReady,
        error: editorError,
        canvasRef,
        zoom,
        panX,
        panY,
        isPanMode,
        zoomIn,
        zoomOut,
        fitToScreen,
        togglePanMode,
        showGrid,
        snapToGrid,
        gridSize,
        toggleGrid,
        toggleSnapToGrid,
        undo,
        redo,
        canUndo,
        canRedo,
        executeCommand,
        markDirty,
        clearDirty,
    } = useMapEditor(editorOptions);

    const selectedCount = selectedIds.length;

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setCanvasAreaSize({ width: el.clientWidth, height: el.clientHeight });
        });
        ro.observe(el);
        setCanvasAreaSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, [isReady, currentMap?.id]);

    useEffect(() => {
        if (!isReady || !canvasRef.current || !currentMap) return;

        const bg = currentMap.backgroundLayer;
        const imageSource =
            (bg?.imageData && String(bg.imageData).trim()) || currentMap.imageUrl || '';
        if (!imageSource) return;

        const size = bg?.size ?? currentMap.imageSize ?? currentMap.gridBounds;
        const layerForRender: BackgroundLayer = {
            imageData: imageSource,
            position: bg?.position ?? { x: 0, y: 0 },
            size,
            opacity: bg?.opacity ?? 1,
            originalSize: bg?.originalSize ?? currentMap.imageSize,
            originalFormat: bg?.originalFormat ?? 'PNG',
            locked: bg?.locked ?? true,
        };

        const syncBackground = async () => {
            try {
                await renderBackgroundLayer(canvasRef.current!, layerForRender);
                updateBackgroundLocked(canvasRef.current!, backgroundLocked);

                if (!hasFitted) {
                    setTimeout(() => {
                        fitToScreen();
                        setHasFitted(true);
                    }, 50);
                }
            } catch (err) {
                console.error('[MapEditor] Background sync failed:', err);
                if (!hasFitted) setHasFitted(true);
            }
        };

        void syncBackground();
    }, [
        isReady,
        canvasRef,
        currentMap?.id,
        currentMap?.imageUrl,
        currentMap?.backgroundLayer?.imageData,
        currentMap?.backgroundLayer?.opacity,
        currentMap?.backgroundLayer?.locked,
        currentMap?.gridBounds?.width,
        currentMap?.gridBounds?.height,
        currentMap?.imageSize?.width,
        currentMap?.imageSize?.height,
        backgroundLocked,
        fitToScreen,
        hasFitted,
    ]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!canvasRef.current || !currentMap) return;

            const moduleType = e.dataTransfer.getData('application/module-type') as ModuleType;
            if (!moduleType) return;

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const canvas = canvasRef.current;
            const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];

            const canvasX = (x - (vpt[4] ?? 0)) / (vpt[0] ?? 1);
            const canvasY = (y - (vpt[5] ?? 0)) / (vpt[3] ?? 1);

            const newModule = createNewModule(moduleType, { x: canvasX, y: canvasY });
            if (newModule) {
                executeCommand(new AddCommand([newModule]));
                markDirty();
            }
        },
        [canvasRef, currentMap, executeCommand, markDirty]
    );

    const saveOptions = useMemo(
        () => ({
            getCurrentMap: () => useMapStore.getState().currentMap,
            getIsDirty: () => useMapStore.getState().isDirty,
            onSuccess: () => {
                clearDirty();
                import('@/stores/uiStore').then(({ useUIStore }) => {
                    useUIStore.getState().showToast('Map saved successfully', 'success');
                });
            },
            onError: (err: Error) => {
                import('@/stores/uiStore').then(({ useUIStore }) => {
                    useUIStore.getState().showToast(err.message || 'Failed to save map', 'error');
                });
            },
            onMapUpdated: (map: CampsiteMap, modules: AnyModule[]) => {
                const prev = useMapStore.getState().currentMap;
                const serverIds = new Set(modules.map((m) => m.id));
                const clientOnly = (prev?.modules ?? []).filter((m) => !serverIds.has(m.id));
                const merged = [...modules, ...clientOnly];
                useMapStore.getState().setMap({ ...map, modules: merged });
                useEditorStore.getState().syncVisualIdSetsFromModules(merged);
            },
        }),
        [clearDirty]
    );

    const { save: handleSave, isSaving, setOriginalMap } = useMapSave(saveOptions);
    saveRef.current = handleSave;

    const saveBaselinePrimedRef = useRef(false);
    useEffect(() => {
        if (!currentMap || saveBaselinePrimedRef.current) return;
        saveBaselinePrimedRef.current = true;
        setOriginalMap(currentMap);
    }, [currentMap, setOriginalMap]);

    const handleBackgroundConfirm = useCallback(
        (layer: BackgroundLayer | null, fitBounds: boolean) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            if (!layer) {
                removeBackgroundLayer(canvas);
                const map = useMapStore.getState().currentMap;
                if (map) {
                    setMap({ ...map, backgroundLayer: undefined });
                }
                return;
            }

            canvas.setDimensions({
                width: layer.size.width,
                height: layer.size.height,
            });

            void renderBackgroundLayer(canvas, layer);

            const map = useMapStore.getState().currentMap;
            if (map) {
                const updatedMap = { ...map, backgroundLayer: layer };
                if (fitBounds) {
                    updatedMap.gridBounds = {
                        width: layer.size.width,
                        height: layer.size.height,
                    };
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
        },
        [canvasRef, setMap, markDirty]
    );

    if (mapError || !currentMap) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4 px-4">
                <div className="text-red-600 dark:text-red-400 text-center max-w-lg">
                    Failed to initialize editor: {mapError || 'Map data was cleared.'}
                </div>
            </div>
        );
    }

    if (editorError) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4 px-4">
                <div className="text-red-600 dark:text-red-400 text-center max-w-lg">
                    Failed to initialize editor: {editorError.message}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0 min-h-[50vh] bg-secondary-100 dark:bg-night-bg">
            <div className={editorToolbarBar}>
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg text-gray-700 dark:text-secondary-300 hover:bg-secondary-100/90 dark:hover:bg-night-surface-alt/90 transition-colors duration-200 shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-heading text-lg font-semibold text-gray-900 dark:text-primary-100 truncate">
                        {currentMap.name}
                    </h1>
                    {mapStoreIsDirty && (
                        <span className="text-xs text-secondary-600 dark:text-secondary-400 shrink-0">
                            • Unsaved
                        </span>
                    )}
                </div>

                <div className={editorToolCluster}>
                    <Tooltip content="Undo (Ctrl+Z)" placement="bottom">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            className={`${toolBtnBase} disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Redo (Ctrl+Y)" placement="bottom">
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            className={`${toolBtnBase} disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className={toolDivider} />

                    <Tooltip content="Zoom Out (Ctrl+-)" placement="bottom">
                        <button type="button" onClick={zoomOut} className={toolBtnBase}>
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <span className="px-2 text-sm font-medium min-w-[4rem] text-center text-gray-800 dark:text-secondary-200">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Tooltip content="Zoom In (Ctrl++)" placement="bottom">
                        <button type="button" onClick={zoomIn} className={toolBtnBase}>
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Fit to Screen (Ctrl+0)" placement="bottom">
                        <button type="button" onClick={fitToScreen} className={toolBtnBase}>
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className={toolDivider} />

                    <Tooltip content="Toggle Grid (Ctrl+G)" placement="bottom">
                        <button
                            type="button"
                            onClick={toggleGrid}
                            className={showGrid ? toolBtnActive : toolBtnBase}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Toggle Snap to Grid" placement="bottom">
                        <button
                            type="button"
                            onClick={toggleSnapToGrid}
                            className={snapToGrid ? toolBtnActive : toolBtnBase}
                        >
                            <Magnet className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className={toolDivider} />

                    <Tooltip content="Pan Mode (Space)" placement="bottom">
                        <button
                            type="button"
                            onClick={togglePanMode}
                            className={isPanMode ? toolBtnActive : toolBtnBase}
                        >
                            <Hand className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className={toolDivider} />

                    <Tooltip content="Toggle Layers Panel" placement="bottom">
                        <button
                            type="button"
                            onClick={() => setShowLayersPanel(!showLayersPanel)}
                            className={showLayersPanel ? toolBtnActive : toolBtnBase}
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Toggle Properties (or right-click a module)" placement="bottom">
                        <button
                            type="button"
                            aria-disabled={selectedCount === 0}
                            aria-label="Toggle Properties Panel"
                            onClick={() => {
                                if (selectedCount === 0) return;
                                setShowPropertiesPanel((v) => !v);
                            }}
                            className={
                                selectedCount > 0 && showPropertiesPanel
                                    ? toolBtnActive
                                    : `${toolBtnBase} ${selectedCount === 0 ? 'opacity-40 cursor-not-allowed' : ''}`
                            }
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Toggle Rulers" placement="bottom">
                        <button
                            type="button"
                            onClick={() => toggleRulers()}
                            className={showRulers ? toolBtnActive : toolBtnBase}
                        >
                            <Ruler className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <div className={toolDivider} />

                    <Tooltip content="Export Map" placement="bottom">
                        <button
                            type="button"
                            onClick={() => setShowExportDialog(true)}
                            className={toolBtnBase}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Background Image" placement="bottom">
                        <button
                            type="button"
                            onClick={() => setShowBackgroundDialog(true)}
                            className={toolBtnBase}
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!mapStoreIsDirty || isSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200 bg-secondary-600 hover:bg-secondary-700 dark:bg-secondary-500 dark:hover:bg-secondary-400 disabled:opacity-45 disabled:cursor-not-allowed shadow-sm dark:shadow-none"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving…
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

            <div className="flex-1 flex overflow-hidden relative min-h-0">
                {showToolbox && (
                    <div className="flex-shrink-0 w-64 border-r border-secondary-200/70 dark:border-secondary-800/55 bg-white/95 dark:bg-night-surface/95 backdrop-blur-sm overflow-y-auto hidden md:block">
                        <ModuleToolbox />
                    </div>
                )}

                <div className="flex-1 relative overflow-hidden min-h-0 min-h-[40vh]">
                    {showRulers && (canvasAreaSize.width > 0 || canvasAreaSize.height > 0) && (
                        <Rulers
                            canvasWidth={canvasAreaSize.width}
                            canvasHeight={canvasAreaSize.height}
                            zoom={zoom}
                            panX={panX}
                            panY={panY}
                        />
                    )}

                    {selectedCount >= 2 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
                            <AlignmentToolbar executeCommand={executeCommand} />
                        </div>
                    )}

                    <div
                        ref={containerRefCallback}
                        className={`w-full h-full min-h-[40vh] overflow-hidden ${showRulers ? 'ml-5 mt-5' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <canvas id="map-canvas" ref={htmlCanvasRef} />
                    </div>
                </div>

                <div className="editor-right-rail flex flex-shrink-0 flex-row h-full min-h-0 min-w-0">
                    {showLayersPanel && (
                        <div className="flex h-full min-h-0 w-64 min-w-0 flex-col border-l border-secondary-200/70 dark:border-secondary-800/55 bg-white/95 dark:bg-night-surface/95 backdrop-blur-sm overflow-y-auto">
                            <LayersPanel
                                onClose={() => setShowLayersPanel(false)}
                                executeCommand={executeCommand}
                            />
                        </div>
                    )}

                    {selectedCount > 0 &&
                        (showPropertiesPanel ? (
                            <div className="relative flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-secondary-200/70 dark:border-secondary-800/55 bg-white/95 dark:bg-night-surface/95 overflow-hidden">
                                <PropertiesPanel
                                    onClose={() => setShowPropertiesPanel(false)}
                                    executeCommand={executeCommand}
                                />
                            </div>
                        ) : (
                            <div className="relative flex h-full min-h-0 w-14 shrink-0 flex-col border-l border-secondary-200/70 dark:border-secondary-800/55 bg-white/95 dark:bg-night-surface/95">
                                <button
                                    type="button"
                                    className="properties-panel-tab"
                                    onClick={() => setShowPropertiesPanel(true)}
                                    title="Open properties (or right-click a module)"
                                >
                                    <Settings size={16} />
                                    <span>Properties</span>
                                </button>
                            </div>
                        ))}
                </div>
            </div>

            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                canvasRef={htmlCanvasRef}
            />

            <BackgroundDialog
                isOpen={showBackgroundDialog}
                onClose={() => setShowBackgroundDialog(false)}
                existingLayer={currentMap?.backgroundLayer || undefined}
                onConfirm={handleBackgroundConfirm}
            />

            <div className="flex items-center justify-between px-4 py-1.5 border-t border-secondary-200/70 dark:border-secondary-800/55 bg-white/90 dark:bg-night-surface/90 backdrop-blur-sm text-xs text-secondary-600 dark:text-secondary-400">
                <div className="flex items-center gap-4">
                    <span>Modules: {currentMap.modules.length}</span>
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

const MapEditorRefactored: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const currentMap = useMapStore((state) => state.currentMap);
    const isLoading = useMapStore((state) => state.isLoading);
    const mapError = useMapStore((state) => state.error);
    const setMap = useMapStore((state) => state.setMap);
    const setLoading = useMapStore((state) => state.setLoading);

    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        isInitialLoadRef.current = true;
        useMapStore.getState().setError(null);
    }, [id]);

    useEffect(() => {
        const loadMapData = async () => {
            if (!id || !isInitialLoadRef.current) return;
            isInitialLoadRef.current = false;

            try {
                setLoading(true);
                const mapData = await getMapById(id);
                if (mapData) {
                    setMap(mapData);
                    useEditorStore.getState().syncVisualIdSetsFromModules(mapData.modules);
                    useEditorStore.getState().clearSelection();
                    console.debug('[MapEditor] Loaded map data:', mapData.id);
                }
            } catch (err) {
                console.error('Failed to load map:', err);
                const isUnauthorized =
                    (err instanceof ApiException && err.statusCode === 401) ||
                    String(err).toLowerCase().includes('401') ||
                    String(err).toLowerCase().includes('authentication') ||
                    String(err).toLowerCase().includes('unauthorized') ||
                    String(err).toLowerCase().includes('session has expired');
                if (isUnauthorized) {
                    useMapStore.getState().setError(
                        'Your session is missing or expired. Please sign in again (use the same URL you use for the app, e.g. http://localhost when using nginx).'
                    );
                    return;
                }
                isInitialLoadRef.current = true;
            } finally {
                setLoading(false);
            }
        };

        void loadMapData();
    }, [id, setLoading, setMap]);

    if (isLoading || (!currentMap && !mapError)) {
        return <PageLoader />;
    }

    if (mapError || !currentMap) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
                <div className="text-red-600 dark:text-red-400 text-center max-w-lg">
                    Failed to initialize editor: {mapError || 'No map data'}
                </div>
            </div>
        );
    }

    return <MapEditorWorkspace key={id} />;
};

export default MapEditorRefactored;
