/**
 * useSelectionManager Hook Unit Tests
 * Simplified tests focusing on store integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useEditorStore } from '@/stores/editorStore';

describe('useSelectionManager store integration', () => {
    beforeEach(() => {
        useEditorStore.setState({
            selectedIds: [],
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should start with empty selection', () => {
        const state = useEditorStore.getState();
        expect(state.selectedIds).toEqual([]);
    });

    it('should set selection via store', () => {
        useEditorStore.getState().setSelection(['mod-1', 'mod-2']);
        expect(useEditorStore.getState().selectedIds).toEqual(['mod-1', 'mod-2']);
    });

    it('should clear selection via store', () => {
        useEditorStore.setState({ selectedIds: ['mod-1', 'mod-2'] });
        useEditorStore.getState().clearSelection();
        expect(useEditorStore.getState().selectedIds).toEqual([]);
    });

    it('should add to selection', () => {
        useEditorStore.setState({ selectedIds: ['mod-1'] });
        useEditorStore.getState().addToSelection('mod-2');
        expect(useEditorStore.getState().selectedIds).toContain('mod-1');
        expect(useEditorStore.getState().selectedIds).toContain('mod-2');
    });

    it('should remove from selection', () => {
        useEditorStore.setState({ selectedIds: ['mod-1', 'mod-2'] });
        useEditorStore.getState().removeFromSelection('mod-1');
        expect(useEditorStore.getState().selectedIds).not.toContain('mod-1');
        expect(useEditorStore.getState().selectedIds).toContain('mod-2');
    });
});
