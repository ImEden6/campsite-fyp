/**
 * Layers Panel
 * Displays modules sorted by z-index for layer management.
 * Supports visibility toggle, lock toggle, and reordering.
 */

import { useCallback, useMemo } from 'react';
import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    ChevronUp,
    ChevronDown,
    Layers,
    GripVertical,
} from 'lucide-react';
import type { AnyModule } from '@/types';
import { useEditorStore, useMapStore, selectModulesSorted } from '@/stores';
import { ReorderCommand } from '@/commands';
import { useCommandHistory } from '@/hooks';
import { getModuleColor } from '@/utils/moduleFactory';

// ============================================================================
// TYPES
// ============================================================================

interface LayersPanelProps {
    onClose?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LayersPanel({ onClose: _onClose }: LayersPanelProps) {
    const {
        selectedIds,
        setSelection,
        toggleSelection,
        toggleModuleVisibility,
        toggleModuleLock,
        isModuleHidden,
        isModuleLocked,
    } = useEditorStore();

    const modules = useMapStore(selectModulesSorted);
    const { executeCommand } = useCommandHistory();

    // Sort modules by z-index (highest first for visual layering)
    const sortedModules = useMemo(() => {
        return [...modules].sort((a, b) => b.zIndex - a.zIndex);
    }, [modules]);

    // Select a module (with shift for add to selection)
    const handleSelect = useCallback(
        (id: string, event: React.MouseEvent) => {
            if (event.shiftKey || event.ctrlKey || event.metaKey) {
                toggleSelection(id);
            } else {
                setSelection([id]);
            }
        },
        [setSelection, toggleSelection]
    );

    // Move module up in z-order
    const handleMoveUp = useCallback(
        (module: AnyModule) => {
            const idx = sortedModules.findIndex((m) => m.id === module.id);
            if (idx === 0) return; // Already at top

            const aboveModule = sortedModules[idx - 1];
            if (!aboveModule) return;
            const newZIndex = aboveModule.zIndex + 1;

            executeCommand(new ReorderCommand(module.id, module.zIndex, newZIndex));
        },
        [sortedModules, executeCommand]
    );

    // Move module down in z-order
    const handleMoveDown = useCallback(
        (module: AnyModule) => {
            const idx = sortedModules.findIndex((m) => m.id === module.id);
            if (idx === sortedModules.length - 1) return; // Already at bottom

            const belowModule = sortedModules[idx + 1];
            if (!belowModule) return;
            const newZIndex = Math.max(0, belowModule.zIndex - 1);

            executeCommand(new ReorderCommand(module.id, module.zIndex, newZIndex));
        },
        [sortedModules, executeCommand]
    );

    // Get module display name
    const getModuleName = (module: AnyModule): string => {
        return (
            (module.metadata as { name?: string })?.name ||
            module.type.replace('_', ' ')
        );
    };

    return (
        <div className="layers-panel">
            <div className="layers-panel__header">
                <Layers size={18} />
                <h3 className="layers-panel__title">Layers</h3>
                <span className="layers-panel__count">{modules.length}</span>
            </div>

            <div className="layers-panel__content">
                {sortedModules.length === 0 ? (
                    <div className="layers-panel__empty">
                        <p>No modules on canvas</p>
                    </div>
                ) : (
                    <ul className="layers-panel__list">
                        {sortedModules.map((module, idx) => {
                            const isSelected = selectedIds.includes(module.id);
                            const isHidden = isModuleHidden(module.id);
                            const isLocked = isModuleLocked(module.id);
                            const color = getModuleColor(module.type);

                            return (
                                <li
                                    key={module.id}
                                    className={`layers-panel__item ${isSelected ? 'layers-panel__item--selected' : ''} ${isHidden ? 'layers-panel__item--hidden' : ''} ${isLocked ? 'layers-panel__item--locked' : ''}`}
                                    onClick={(e) => handleSelect(module.id, e)}
                                >
                                    <div className="layers-panel__item-drag">
                                        <GripVertical size={14} />
                                    </div>

                                    <div
                                        className="layers-panel__item-color"
                                        style={{ backgroundColor: color }}
                                    />

                                    <span className={`layers-panel__item-name ${isLocked ? 'layers-panel__item-name--locked' : ''}`}>
                                        {isLocked && (
                                            <Lock size={12} className="layers-panel__item-lock-icon" />
                                        )}
                                        {getModuleName(module)}
                                    </span>

                                    <div className="layers-panel__item-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveUp(module);
                                            }}
                                            disabled={idx === 0}
                                            title="Move up"
                                            aria-label="Move layer up"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveDown(module);
                                            }}
                                            disabled={
                                                idx === sortedModules.length - 1
                                            }
                                            title="Move down"
                                            aria-label="Move layer down"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleModuleVisibility(
                                                    module.id,
                                                    executeCommand
                                                );
                                            }}
                                            title={
                                                isHidden
                                                    ? 'Show layer'
                                                    : 'Hide layer'
                                            }
                                            aria-label={
                                                isHidden
                                                    ? 'Show layer'
                                                    : 'Hide layer'
                                            }
                                        >
                                            {isHidden ? (
                                                <EyeOff size={14} />
                                            ) : (
                                                <Eye size={14} />
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleModuleLock(module.id, executeCommand);
                                            }}
                                            title={
                                                isLocked
                                                    ? 'Unlock layer'
                                                    : 'Lock layer'
                                            }
                                            aria-label={
                                                isLocked
                                                    ? 'Unlock layer'
                                                    : 'Lock layer'
                                            }
                                        >
                                            {isLocked ? (
                                                <Lock size={14} />
                                            ) : (
                                                <Unlock size={14} />
                                            )}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default LayersPanel;
