/**
 * Editor Store
 * Manages UI state: selection, tools, grid settings, and command history.
 */

import { create } from 'zustand';
import type { AnyModule } from '@/types';
import type { Command } from '@/commands/Command';
import { useMapStore } from './mapStore';

// Types
type Tool = 'select' | 'pan';

interface EditorState {
    // Selection
    selectedIds: string[];

    // Tool
    activeTool: Tool;

    // Grid
    snapToGrid: boolean;
    gridSize: number;
    showGrid: boolean;

    // History
    undoStack: Command[];
    redoStack: Command[];
    historyLimit: number;

    // Clipboard
    clipboard: AnyModule[];
}

interface EditorActions {
    // Selection
    select: (ids: string[], additive?: boolean) => void;
    selectAll: () => void;
    clearSelection: () => void;
    toggleSelection: (id: string) => void;

    // Tool
    setTool: (tool: Tool) => void;

    // Grid
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    setGridSize: (size: number) => void;

    // History
    execute: (command: Command) => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;

    // Clipboard
    copy: () => void;
    cut: () => void;
    paste: (offset?: { x: number; y: number }) => AnyModule[];

    // Computed
    canUndo: () => boolean;
    canRedo: () => boolean;
}

type EditorStore = EditorState & EditorActions;

// Default values
const DEFAULT_GRID_SIZE = 20;
const DEFAULT_HISTORY_LIMIT = 50;

export const useEditorStore = create<EditorStore>((set, get) => ({
    // Initial state
    selectedIds: [],
    activeTool: 'select',
    snapToGrid: true,
    gridSize: DEFAULT_GRID_SIZE,
    showGrid: true,
    undoStack: [],
    redoStack: [],
    historyLimit: DEFAULT_HISTORY_LIMIT,
    clipboard: [],

    // Selection
    select: (ids, additive = false) => set((state) => ({
        selectedIds: additive
            ? [...new Set([...state.selectedIds, ...ids])]
            : ids,
    })),

    selectAll: () => {
        const modules = useMapStore.getState().getModules();
        set({ selectedIds: modules.map((m) => m.id) });
    },

    clearSelection: () => set({ selectedIds: [] }),

    toggleSelection: (id) => set((state) => {
        const isSelected = state.selectedIds.includes(id);
        return {
            selectedIds: isSelected
                ? state.selectedIds.filter((i) => i !== id)
                : [...state.selectedIds, id],
        };
    }),

    // Tool
    setTool: (tool) => set({ activeTool: tool }),

    // Grid
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

    toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

    setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),

    // History
    execute: (command) => {
        command.execute();

        set((state) => {
            const newStack = [...state.undoStack, command];
            // Prune old commands if over limit
            const prunedStack = newStack.slice(-state.historyLimit);

            return {
                undoStack: prunedStack,
                redoStack: [], // Clear redo stack on new action
            };
        });

        // Mark map as dirty
        useMapStore.getState().markDirty();
    },

    undo: () => {
        const { undoStack, redoStack } = get();
        if (undoStack.length === 0) return;

        const command = undoStack[undoStack.length - 1]!;

        command.undo();

        set({
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, command],
        });

        useMapStore.getState().markDirty();
    },

    redo: () => {
        const { undoStack, redoStack } = get();
        if (redoStack.length === 0) return;

        const command = redoStack[redoStack.length - 1]!;

        command.execute();

        set({
            undoStack: [...undoStack, command],
            redoStack: redoStack.slice(0, -1),
        });

        useMapStore.getState().markDirty();
    },

    clearHistory: () => set({ undoStack: [], redoStack: [] }),

    // Clipboard
    copy: () => {
        const { selectedIds } = get();
        const modules = useMapStore.getState().getModules();
        const selected = modules.filter((m) => selectedIds.includes(m.id));

        // Deep clone to avoid reference issues
        set({ clipboard: JSON.parse(JSON.stringify(selected)) });
    },

    cut: () => {
        const { selectedIds, copy } = get();
        if (selectedIds.length === 0) return;

        // Copy first
        copy();

        // Then delete via command (caller should use DeleteModuleCommand)
        // Note: The actual deletion should be done by the component using a command
    },

    paste: (offset = { x: 20, y: 20 }) => {
        const { clipboard } = get();
        if (clipboard.length === 0) return [];

        // Create new modules with unique IDs and offset positions
        const newModules: AnyModule[] = clipboard.map((m) => ({
            ...m,
            id: `module-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            position: {
                x: m.position.x + offset.x,
                y: m.position.y + offset.y,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        return newModules;
    },

    // Computed
    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,
}));

// Selectors
export const selectIsSelected = (id: string) => (state: EditorStore) =>
    state.selectedIds.includes(id);

export const selectSelectedCount = (state: EditorStore) =>
    state.selectedIds.length;
