/**
 * Editor Store
 * Manages map editor state and tools
 */

import { create } from 'zustand';
import type { EditorState, ModuleType, CampsiteMap, AnyModule, Position } from '@/types';
import { HistoryManager, type HistoryAction } from '@/utils/historyManager';
import { validateClipboardData, sanitizeClipboardData } from '@/utils/validationUtils';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';

interface EditorStoreState {
  editor: EditorState;
  historyManager: HistoryManager;
  
  // Basic editor actions
  setEditor: (updates: Partial<EditorState>) => void;
  resetEditor: () => void;
  toggleLayerVisibility: (layer: ModuleType) => void;
  
  // History management actions
  pushHistory: (mapState: CampsiteMap, action: HistoryAction) => void;
  undo: () => CampsiteMap | null;
  redo: () => CampsiteMap | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Clipboard management actions
  copyModules: (modules: AnyModule[]) => void;
  cutModules: (modules: AnyModule[]) => void;
  pasteModules: (offset?: Position) => AnyModule[];
  duplicateModules: (modules: AnyModule[], offset?: Position) => AnyModule[];
  
  // Selection actions
  selectModules: (moduleIds: string[]) => void;
  clearSelection: () => void;
  
  // Keyboard shortcuts actions
  toggleShortcutsDialog: () => void;
  updatePressedKeys: (keys: Set<string>) => void;
}

const defaultEditor: EditorState = {
  selectedModuleIds: [],
  clipboardModules: [],
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
  isEditing: false,
  currentTool: 'select',
  snapToGrid: true,
  gridSize: 20,
  showGrid: true,
  showRulers: true,
  showMinimap: false,
  layerVisibility: {
    campsite: true,
    toilet: true,
    storage: true,
    building: true,
    parking: true,
    road: true,
    water_source: true,
    electricity: true,
    waste_disposal: true,
    recreation: true,
    custom: true,
  },
  activeTransform: null,
  showShortcutsDialog: false,
  pressedKeys: new Set<string>(),
};

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  editor: defaultEditor,
  historyManager: new HistoryManager({ maxHistorySize: 50 }),

  // Basic editor actions
  setEditor: (updates) =>
    set((state) => ({
      editor: { ...state.editor, ...updates },
    })),

  resetEditor: () => 
    set({ 
      editor: defaultEditor,
      historyManager: new HistoryManager({ maxHistorySize: 50 }),
    }),

  toggleLayerVisibility: (layer) =>
    set((state) => ({
      editor: {
        ...state.editor,
        layerVisibility: {
          ...state.editor.layerVisibility,
          [layer]: !state.editor.layerVisibility[layer],
        },
      },
    })),

  // History management actions
  pushHistory: (mapState, action) => {
    const { historyManager } = get();
    historyManager.pushState(mapState, action);
    
    // Update editor state to reflect history changes
    set((state) => ({
      editor: {
        ...state.editor,
        undoStack: Array(historyManager.getUndoStackSize()).fill(null),
        redoStack: Array(historyManager.getRedoStackSize()).fill(null),
      },
    }));
  },

  undo: () => {
    const { historyManager } = get();
    const previousState = historyManager.undo();
    
    // Update editor state to reflect history changes
    set((state) => ({
      editor: {
        ...state.editor,
        undoStack: Array(historyManager.getUndoStackSize()).fill(null),
        redoStack: Array(historyManager.getRedoStackSize()).fill(null),
      },
    }));
    
    return previousState;
  },

  redo: () => {
    const { historyManager } = get();
    const nextState = historyManager.redo();
    
    // Update editor state to reflect history changes
    set((state) => ({
      editor: {
        ...state.editor,
        undoStack: Array(historyManager.getUndoStackSize()).fill(null),
        redoStack: Array(historyManager.getRedoStackSize()).fill(null),
      },
    }));
    
    return nextState;
  },

  canUndo: () => {
    const { historyManager } = get();
    return historyManager.canUndo();
  },

  canRedo: () => {
    const { historyManager } = get();
    return historyManager.canRedo();
  },

  clearHistory: () => {
    const { historyManager } = get();
    historyManager.clear();
    
    set((state) => ({
      editor: {
        ...state.editor,
        undoStack: [],
        redoStack: [],
      },
    }));
  },

  // Clipboard management actions
  copyModules: (modules) => {
    try {
      // Validate clipboard data before copying
      const validation = validateClipboardData(modules);
      
      if (!validation.isValid) {
        errorLogger.warn(
          ErrorCategory.CLIPBOARD,
          'Attempted to copy invalid modules, sanitizing data',
          { errors: validation.errors, moduleCount: modules.length }
        );
        
        // Sanitize the data by removing invalid modules
        const sanitized = sanitizeClipboardData(modules);
        
        set((state) => ({
          editor: {
            ...state.editor,
            clipboardModules: sanitized.map(module => ({ ...module })),
          },
        }));
        
        return;
      }
      
      set((state) => ({
        editor: {
          ...state.editor,
          clipboardModules: modules.map(module => ({ ...module })),
        },
      }));
      
      errorLogger.info(
        ErrorCategory.CLIPBOARD,
        'Modules copied to clipboard',
        { moduleCount: modules.length }
      );
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Error copying modules to clipboard',
        { moduleCount: modules.length },
        error as Error
      );
    }
  },

  cutModules: (modules) => {
    try {
      // Validate clipboard data before cutting
      const validation = validateClipboardData(modules);
      
      if (!validation.isValid) {
        errorLogger.warn(
          ErrorCategory.CLIPBOARD,
          'Attempted to cut invalid modules, sanitizing data',
          { errors: validation.errors, moduleCount: modules.length }
        );
        
        // Sanitize the data by removing invalid modules
        const sanitized = sanitizeClipboardData(modules);
        
        set((state) => ({
          editor: {
            ...state.editor,
            clipboardModules: sanitized.map(module => ({ ...module })),
          },
        }));
        
        return;
      }
      
      set((state) => ({
        editor: {
          ...state.editor,
          clipboardModules: modules.map(module => ({ ...module })),
        },
      }));
      
      errorLogger.info(
        ErrorCategory.CLIPBOARD,
        'Modules cut to clipboard',
        { moduleCount: modules.length }
      );
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Error cutting modules to clipboard',
        { moduleCount: modules.length },
        error as Error
      );
    }
  },

  pasteModules: (offset = { x: 20, y: 20 }) => {
    const { editor } = get();
    const { clipboardModules } = editor;
    
    try {
      if (clipboardModules.length === 0) {
        errorLogger.warn(
          ErrorCategory.CLIPBOARD,
          'Attempted to paste from empty clipboard',
          {}
        );
        return [];
      }
      
      // Validate clipboard data before pasting
      const validation = validateClipboardData(clipboardModules);
      
      if (!validation.isValid) {
        errorLogger.error(
          ErrorCategory.CLIPBOARD,
          'Clipboard contains invalid data',
          { errors: validation.errors }
        );
        
        // Attempt to sanitize and use valid modules only
        const sanitized = sanitizeClipboardData(clipboardModules);
        
        if (sanitized.length === 0) {
          errorLogger.error(
            ErrorCategory.CLIPBOARD,
            'No valid modules found in clipboard after sanitization',
            {}
          );
          return [];
        }
        
        errorLogger.info(
          ErrorCategory.CLIPBOARD,
          'Using sanitized clipboard data',
          { originalCount: clipboardModules.length, sanitizedCount: sanitized.length }
        );
        
        // Use sanitized modules
        const pastedModules: AnyModule[] = sanitized.map((module) => ({
          ...module,
          id: `${module.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: module.position.x + offset.x,
            y: module.position.y + offset.y,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        return pastedModules;
      }
      
      // Create new modules with new IDs and offset positions
      const pastedModules: AnyModule[] = clipboardModules.map((module) => ({
        ...module,
        id: `${module.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: module.position.x + offset.x,
          y: module.position.y + offset.y,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      errorLogger.info(
        ErrorCategory.CLIPBOARD,
        'Modules pasted from clipboard',
        { moduleCount: pastedModules.length }
      );
      
      return pastedModules;
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Error pasting modules from clipboard',
        { clipboardSize: clipboardModules.length },
        error as Error
      );
      return [];
    }
  },

  duplicateModules: (modules, offset = { x: 20, y: 20 }) => {
    try {
      // Validate modules before duplicating
      const validation = validateClipboardData(modules);
      
      if (!validation.isValid) {
        errorLogger.warn(
          ErrorCategory.CLIPBOARD,
          'Attempted to duplicate invalid modules, sanitizing data',
          { errors: validation.errors, moduleCount: modules.length }
        );
        
        // Sanitize the data
        const sanitized = sanitizeClipboardData(modules);
        
        if (sanitized.length === 0) {
          errorLogger.error(
            ErrorCategory.CLIPBOARD,
            'No valid modules to duplicate after sanitization',
            {}
          );
          return [];
        }
        
        // Create new modules with new IDs and offset positions
        const duplicatedModules: AnyModule[] = sanitized.map((module) => ({
          ...module,
          id: `${module.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: module.position.x + offset.x,
            y: module.position.y + offset.y,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        
        return duplicatedModules;
      }
      
      // Create new modules with new IDs and offset positions
      const duplicatedModules: AnyModule[] = modules.map((module) => ({
        ...module,
        id: `${module.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: module.position.x + offset.x,
          y: module.position.y + offset.y,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      errorLogger.info(
        ErrorCategory.CLIPBOARD,
        'Modules duplicated',
        { moduleCount: duplicatedModules.length }
      );
      
      return duplicatedModules;
    } catch (error) {
      errorLogger.error(
        ErrorCategory.CLIPBOARD,
        'Error duplicating modules',
        { moduleCount: modules.length },
        error as Error
      );
      return [];
    }
  },

  // Selection actions
  selectModules: (moduleIds) => {
    set((state) => ({
      editor: {
        ...state.editor,
        selectedModuleIds: moduleIds,
      },
    }));
  },

  clearSelection: () => {
    set((state) => ({
      editor: {
        ...state.editor,
        selectedModuleIds: [],
      },
    }));
  },

  // Keyboard shortcuts actions
  toggleShortcutsDialog: () => {
    set((state) => ({
      editor: {
        ...state.editor,
        showShortcutsDialog: !state.editor.showShortcutsDialog,
      },
    }));
  },

  updatePressedKeys: (keys) => {
    set((state) => ({
      editor: {
        ...state.editor,
        pressedKeys: new Set(keys),
      },
    }));
  },
}));
