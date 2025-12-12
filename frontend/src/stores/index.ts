/**
 * Store Exports
 * Central export point for all Zustand stores
 */

// Core stores
export { useAuthStore } from './authStore';
export { useUIStore } from './uiStore';
export { useBookingStore } from './bookingStore';

// Map store (data only - editor will use Fabric.js)
export { useMapStore, selectModuleById, selectModulesSorted } from './mapStore';

// Editor store (editor UI state - selection, clipboard, rulers, panels)
export {
    useEditorStore,
    selectSelectionCount,
    selectIsSelected,
    selectGuidesByOrientation,
    selectHasSelection,
    selectHasMultiSelection,
    type Guide,
    type EditorTool,
} from './editorStore';
