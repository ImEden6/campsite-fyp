/**
 * Editor Store
 * Consolidated state management for the map editor.
 * Handles selection, clipboard, grid, rulers, guides, and panel visibility.
 * This is separate from mapStore which holds the actual map data.
 */

import { create } from 'zustand';
import type { AnyModule, ModuleType, Position } from '@/types';
import { useMapStore } from './mapStore';
import { PropertyCommand } from '@/commands';
import type { Command } from '@/commands/Command';

// Use native crypto.randomUUID() for ID generation
const generateId = (): string => crypto.randomUUID();

// ============================================================================
// TYPES
// ============================================================================

export interface Guide {
    id: string;
    orientation: 'horizontal' | 'vertical';
    position: number; // pixels from origin
}

export type EditorTool = 'select' | 'pan' | 'add';

export interface EditorState {
    // === Selection ===
    selectedIds: string[];
    hoveredId: string | null;

    // === Clipboard ===
    clipboard: AnyModule[];
    clipboardOffset: Position;

    // === Tool Mode ===
    activeTool: EditorTool;
    moduleToAdd: ModuleType | null;

    // === Grid Settings ===
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;

    // === Ruler Settings ===
    showRulers: boolean;
    guides: Guide[];
    snapToGuides: boolean;

    // === Layer Settings ===
    hiddenModuleIds: Set<string>;
    lockedModuleIds: Set<string>;
    expandedTypeGroups: Set<ModuleType>;

    // === Panel Visibility ===
    showPropertiesPanel: boolean;
    showLayersPanel: boolean;
    showToolbox: boolean;
}

export interface EditorActions {
    // === Selection ===
    setSelection: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
    setHoveredId: (id: string | null) => void;

    // === Clipboard ===
    copyToClipboard: (modules: AnyModule[]) => void;
    cutToClipboard: (modules: AnyModule[]) => void;
    clearClipboard: () => void;
    hasClipboard: () => boolean;

    // === Tool Mode ===
    setActiveTool: (tool: EditorTool) => void;
    setModuleToAdd: (type: ModuleType | null) => void;

    // === Grid Settings ===
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    setGridSize: (size: number) => void;

    // === Ruler Settings ===
    toggleRulers: () => void;
    toggleSnapToGuides: () => void;
    addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
    removeGuide: (id: string) => void;
    moveGuide: (id: string, newPosition: number) => void;
    clearGuides: () => void;

    // === Layer Settings ===
    toggleModuleVisibility: (id: string, executeCommand?: (command: Command) => void) => void;
    toggleModuleLock: (id: string, executeCommand?: (command: Command) => void) => void;
    isModuleHidden: (id: string) => boolean;
    isModuleLocked: (id: string) => boolean;
    toggleTypeGroupExpanded: (type: ModuleType) => void;

    // === Panel Visibility ===
    togglePanel: (panel: 'properties' | 'layers' | 'toolbox') => void;
    setShowPropertiesPanel: (show: boolean) => void;
    setShowLayersPanel: (show: boolean) => void;
    setShowToolbox: (show: boolean) => void;

    // === Reset ===
    resetEditor: () => void;
}

type EditorStore = EditorState & EditorActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: EditorState = {
    // Selection
    selectedIds: [],
    hoveredId: null,

    // Clipboard
    clipboard: [],
    clipboardOffset: { x: 20, y: 20 },

    // Tool Mode
    activeTool: 'select',
    moduleToAdd: null,

    // Grid Settings
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,

    // Ruler Settings
    showRulers: false,
    guides: [],
    snapToGuides: true,

    // Layer Settings
    hiddenModuleIds: new Set(),
    lockedModuleIds: new Set(),
    expandedTypeGroups: new Set(),

    // Panel Visibility
    showPropertiesPanel: true,
    showLayersPanel: false,
    showToolbox: true,
};

// ============================================================================
// STORE
// ============================================================================

export const useEditorStore = create<EditorStore>((set, get) => ({
    ...initialState,

    // === Selection ===
    setSelection: (ids) => set({ selectedIds: ids }),

    addToSelection: (id) =>
        set((state) => ({
            selectedIds: state.selectedIds.includes(id)
                ? state.selectedIds
                : [...state.selectedIds, id],
        })),

    removeFromSelection: (id) =>
        set((state) => ({
            selectedIds: state.selectedIds.filter((i) => i !== id),
        })),

    toggleSelection: (id) =>
        set((state) => ({
            selectedIds: state.selectedIds.includes(id)
                ? state.selectedIds.filter((i) => i !== id)
                : [...state.selectedIds, id],
        })),

    clearSelection: () => set({ selectedIds: [] }),

    setHoveredId: (id) => set({ hoveredId: id }),

    // === Clipboard ===
    copyToClipboard: (modules) =>
        set({
            clipboard: modules.map((m) => ({ ...m })), // Deep copy
        }),

    cutToClipboard: (modules) =>
        set({
            clipboard: modules.map((m) => ({ ...m })), // Deep copy
            // Note: Caller should also delete the modules using DeleteCommand
        }),

    clearClipboard: () => set({ clipboard: [] }),

    hasClipboard: () => get().clipboard.length > 0,

    // === Tool Mode ===
    setActiveTool: (tool) =>
        set({
            activeTool: tool,
            moduleToAdd: tool === 'add' ? get().moduleToAdd : null,
        }),

    setModuleToAdd: (type) =>
        set({
            moduleToAdd: type,
            activeTool: type ? 'add' : 'select',
        }),

    // === Grid Settings ===
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

    toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

    setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),

    // === Ruler Settings ===
    toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),

    toggleSnapToGuides: () =>
        set((state) => ({ snapToGuides: !state.snapToGuides })),

    addGuide: (orientation, position) =>
        set((state) => ({
            guides: [
                ...state.guides,
                { id: generateId(), orientation, position },
            ],
        })),

    removeGuide: (id) =>
        set((state) => ({
            guides: state.guides.filter((g) => g.id !== id),
        })),

    moveGuide: (id, newPosition) =>
        set((state) => ({
            guides: state.guides.map((g) =>
                g.id === id ? { ...g, position: newPosition } : g
            ),
        })),

    clearGuides: () => set({ guides: [] }),

    // === Layer Settings ===
    toggleModuleVisibility: (id, executeCommand?: (command: import('@/commands').Command) => void) => {
        const { getModule } = useMapStore.getState();
        const module = getModule(id);
        
        if (!module) {
            console.warn(`[editorStore] Module ${id} not found for visibility toggle`);
            return;
        }
        
        try {
            const newVisible = !module.visible;
            
            // If executeCommand is provided, use PropertyCommand for undo/redo support
            if (executeCommand) {
                executeCommand(new PropertyCommand([{
                    moduleId: id,
                    oldProps: { visible: module.visible },
                    newProps: { visible: newVisible },
                }]));
            } else {
                // Fallback: direct update (bypasses command history)
                // This maintains backward compatibility but logs a warning
                console.warn(
                    '[editorStore] toggleModuleVisibility called without executeCommand. ' +
                    'This bypasses undo/redo. Consider passing executeCommand parameter.'
                );
                const { _updateModule } = useMapStore.getState();
                _updateModule(id, { visible: newVisible });
                
                // Sync editorStore Set
                set((state) => {
                    const newHidden = new Set(state.hiddenModuleIds);
                    if (newVisible) {
                        newHidden.delete(id);
                    } else {
                        newHidden.add(id);
                    }
                    return { hiddenModuleIds: newHidden };
                });
            }
        } catch (error) {
            console.error(`[editorStore] Error toggling visibility for module ${id}:`, error);
        }
    },

    toggleModuleLock: (id, executeCommand?: (command: import('@/commands').Command) => void) => {
        const { getModule } = useMapStore.getState();
        const module = getModule(id);
        
        if (!module) {
            console.warn(`[editorStore] Module ${id} not found for lock toggle`);
            return;
        }
        
        try {
            const shouldLock = !module.locked;
            
            // If executeCommand is provided, use PropertyCommand for undo/redo support
            if (executeCommand) {
                executeCommand(new PropertyCommand([{
                    moduleId: id,
                    oldProps: { locked: module.locked },
                    newProps: { locked: shouldLock },
                }]));
            } else {
                // Fallback: direct update (bypasses command history)
                // This maintains backward compatibility but logs a warning
                console.warn(
                    '[editorStore] toggleModuleLock called without executeCommand. ' +
                    'This bypasses undo/redo. Consider passing executeCommand parameter.'
                );
                const { _updateModule } = useMapStore.getState();
                _updateModule(id, { locked: shouldLock });
                
                // Sync editorStore Set
                set((state) => {
                    const newLockedSet = new Set(state.lockedModuleIds);
                    if (shouldLock) {
                        newLockedSet.add(id);
                    } else {
                        newLockedSet.delete(id);
                    }
                    return { lockedModuleIds: newLockedSet };
                });
            }
        } catch (error) {
            console.error(`[editorStore] Error toggling lock for module ${id}:`, error);
        }
    },

    isModuleHidden: (id) => get().hiddenModuleIds.has(id),

    isModuleLocked: (id) => get().lockedModuleIds.has(id),

    toggleTypeGroupExpanded: (type) =>
        set((state) => {
            const newExpanded = new Set(state.expandedTypeGroups);
            if (newExpanded.has(type)) {
                newExpanded.delete(type);
            } else {
                newExpanded.add(type);
            }
            return { expandedTypeGroups: newExpanded };
        }),

    // === Panel Visibility ===
    togglePanel: (panel) =>
        set((state) => {
            switch (panel) {
                case 'properties':
                    return { showPropertiesPanel: !state.showPropertiesPanel };
                case 'layers':
                    return { showLayersPanel: !state.showLayersPanel };
                case 'toolbox':
                    return { showToolbox: !state.showToolbox };
                default:
                    return state;
            }
        }),

    setShowPropertiesPanel: (show) => set({ showPropertiesPanel: show }),

    setShowLayersPanel: (show) => set({ showLayersPanel: show }),

    setShowToolbox: (show) => set({ showToolbox: show }),

    // === Reset ===
    resetEditor: () =>
        set({
            ...initialState,
            // Preserve panel visibility preferences
            showPropertiesPanel: get().showPropertiesPanel,
            showLayersPanel: get().showLayersPanel,
            showToolbox: get().showToolbox,
        }),
}));

// ============================================================================
// SELECTORS
// ============================================================================

/** Get number of selected modules */
export const selectSelectionCount = (state: EditorStore) =>
    state.selectedIds.length;

/** Check if a specific module is selected */
export const selectIsSelected = (id: string) => (state: EditorStore) =>
    state.selectedIds.includes(id);

/** Get all guides of a specific orientation */
export const selectGuidesByOrientation =
    (orientation: 'horizontal' | 'vertical') => (state: EditorStore) =>
        state.guides.filter((g) => g.orientation === orientation);

/** Check if any module is selected */
export const selectHasSelection = (state: EditorStore) =>
    state.selectedIds.length > 0;

/** Check if multiple modules are selected */
export const selectHasMultiSelection = (state: EditorStore) =>
    state.selectedIds.length > 1;
