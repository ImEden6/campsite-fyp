/**
 * Properties Panel
 * Displays and edits properties of selected modules.
 * Supports single-select full editing and multi-select common properties.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    X,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    RotateCcw,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import type { AnyModule } from '@/types';
import { useEditorStore } from '@/stores';
import { useMapStore } from '@/stores/mapStore';
import { PropertyCommand, type PropertyChange, type Command } from '@/commands';

// ============================================================================
// TYPES
// ============================================================================


interface PropertyInputProps {
    label: string;
    value: string | number | boolean | undefined;
    type?: 'text' | 'number' | 'checkbox';
    mixed?: boolean;
    disabled?: boolean;
    onChange: (value: string | number | boolean) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PropertyInput({
    label,
    value,
    type = 'text',
    mixed = false,
    disabled = false,
    onChange,
}: PropertyInputProps) {
    const id = `prop-${label.toLowerCase().replace(/\s+/g, '-')}`;

    if (type === 'checkbox') {
        return (
            <label className="properties-panel__field properties-panel__field--checkbox">
                <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span>{label}</span>
            </label>
        );
    }

    return (
        <div className="properties-panel__field">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type={type}
                value={mixed ? '' : (typeof value === 'boolean' ? String(value) : (value ?? ''))}
                placeholder={mixed ? 'Mixed' : undefined}
                disabled={disabled}
                onChange={(e) =>
                    onChange(
                        type === 'number'
                            ? parseFloat(e.target.value) || 0
                            : e.target.value
                    )
                }
            />
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface PropertiesPanelProps {
    onClose?: () => void;
    executeCommand: (command: Command) => void;
}

// ... (PropertyInput component remains unchanged)

export function PropertiesPanel({ onClose, executeCommand }: PropertiesPanelProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['transform', 'metadata'])
    );
    const [pendingChanges, setPendingChanges] = useState<
        Map<string, Partial<AnyModule>>
    >(new Map());

    const { selectedIds, toggleModuleVisibility, toggleModuleLock } =
        useEditorStore();
    const { getModule } = useMapStore();

    // Get selected modules
    const selectedModules = selectedIds
        .map((id) => getModule(id))
        .filter((m): m is AnyModule => m !== undefined);

    const singleModule = selectedModules.length === 1 ? selectedModules[0] : null;
    const hasSelection = selectedModules.length > 0;
    const isMultiSelect = selectedModules.length > 1;

    // Reset pending changes when selection changes
    useEffect(() => {
        setPendingChanges(new Map());
    }, [selectedIds]);

    // Toggle section expansion
    const toggleSection = useCallback((section: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    }, []);

    // Queue a property change (batched on blur)
    const queueChange = useCallback(
        (moduleId: string, key: string, value: unknown) => {
            setPendingChanges((prev) => {
                const next = new Map(prev);
                const existing = next.get(moduleId) || {};
                next.set(moduleId, { ...existing, [key]: value });
                return next;
            });
        },
        []
    );

    // Commit all pending changes
    const commitChanges = useCallback(() => {
        if (pendingChanges.size === 0) return;

        const changes: PropertyChange[] = [];

        pendingChanges.forEach((newProps, moduleId) => {
            const module = getModule(moduleId);
            if (!module) return;

            // Build oldProps from current module state
            const oldProps: Record<string, unknown> = {};
            Object.keys(newProps).forEach((key) => {
                oldProps[key] = module[key as keyof AnyModule];
            });

            changes.push({ moduleId, oldProps, newProps });
        });

        if (changes.length > 0) {
            executeCommand(new PropertyCommand(changes));
        }

        setPendingChanges(new Map());
    }, [pendingChanges, getModule, executeCommand]);

    // Handle input change for single module
    const handleSingleChange = useCallback(
        (key: keyof AnyModule, value: unknown) => {
            if (!singleModule) return;
            queueChange(singleModule.id, key, value);
        },
        [singleModule, queueChange]
    );

    // Handle multi-select change (apply delta to all)
    const handleMultiChange = useCallback(
        (key: keyof AnyModule, value: unknown) => {
            selectedModules.forEach((module) => {
                queueChange(module.id, key, value);
            });
        },
        [selectedModules, queueChange]
    );

    // Check if a property is mixed across selection
    const isMixed = useCallback(
        (key: keyof AnyModule): boolean => {
            if (!isMultiSelect) return false;
            const values = selectedModules.map((m) => m[key]);
            return !values.every((v) => v === values[0]);
        },
        [selectedModules, isMultiSelect]
    );

    // Render section header
    const renderSectionHeader = (title: string, key: string) => (
        <button
            className="properties-panel__section-header"
            onClick={() => toggleSection(key)}
            aria-expanded={expandedSections.has(key)}
        >
            <span>{title}</span>
            {expandedSections.has(key) ? (
                <ChevronUp size={16} />
            ) : (
                <ChevronDown size={16} />
            )}
        </button>
    );

    return (
        <div className="properties-panel" onBlur={commitChanges}>
            <div className="properties-panel__header">
                <h3 className="properties-panel__title">
                    {isMultiSelect
                        ? `${selectedModules.length} Selected`
                        : singleModule
                            ? singleModule.type.replace('_', ' ')
                            : 'Properties'}
                </h3>
                {onClose && (
                    <button
                        className="properties-panel__close"
                        onClick={onClose}
                        aria-label="Close properties"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {!hasSelection ? (
                <div className="properties-panel__empty">
                    <p>Select a module to view its properties</p>
                </div>
            ) : (
                <div className="properties-panel__content">
                    {/* Quick Actions */}
                    <div className="properties-panel__actions">
                        <button
                            onClick={() =>
                                selectedIds.forEach(toggleModuleLock)
                            }
                            title={
                                singleModule?.locked ? 'Unlock' : 'Lock module'
                            }
                        >
                            {singleModule?.locked ? (
                                <Lock size={16} />
                            ) : (
                                <Unlock size={16} />
                            )}
                        </button>
                        <button
                            onClick={() =>
                                selectedIds.forEach(toggleModuleVisibility)
                            }
                            title={
                                singleModule?.visible ? 'Hide' : 'Show module'
                            }
                        >
                            {singleModule?.visible ? (
                                <Eye size={16} />
                            ) : (
                                <EyeOff size={16} />
                            )}
                        </button>
                        <button
                            onClick={() =>
                                handleMultiChange('rotation', 0)
                            }
                            title="Reset rotation"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>

                    {/* Transform Section */}
                    {renderSectionHeader('Transform', 'transform')}
                    {expandedSections.has('transform') && (
                        <div className="properties-panel__section">
                            <div className="properties-panel__row">
                                <PropertyInput
                                    label="X"
                                    type="number"
                                    value={singleModule?.position.x}
                                    mixed={isMixed('position')}
                                    onChange={(v) =>
                                        handleSingleChange('position', {
                                            ...singleModule?.position,
                                            x: Number(v),
                                        })
                                    }
                                />
                                <PropertyInput
                                    label="Y"
                                    type="number"
                                    value={singleModule?.position.y}
                                    mixed={isMixed('position')}
                                    onChange={(v) =>
                                        handleSingleChange('position', {
                                            ...singleModule?.position,
                                            y: Number(v),
                                        })
                                    }
                                />
                            </div>
                            <div className="properties-panel__row">
                                <PropertyInput
                                    label="Width"
                                    type="number"
                                    value={singleModule?.size.width}
                                    mixed={isMixed('size')}
                                    onChange={(v) =>
                                        handleSingleChange('size', {
                                            ...singleModule?.size,
                                            width: Number(v),
                                        })
                                    }
                                />
                                <PropertyInput
                                    label="Height"
                                    type="number"
                                    value={singleModule?.size.height}
                                    mixed={isMixed('size')}
                                    onChange={(v) =>
                                        handleSingleChange('size', {
                                            ...singleModule?.size,
                                            height: Number(v),
                                        })
                                    }
                                />
                            </div>
                            <PropertyInput
                                label="Rotation"
                                type="number"
                                value={singleModule?.rotation}
                                mixed={isMixed('rotation')}
                                onChange={(v) =>
                                    handleMultiChange('rotation', Number(v))
                                }
                            />
                        </div>
                    )}

                    {/* Metadata Section (single select only) */}
                    {singleModule && (
                        <>
                            {renderSectionHeader('Details', 'metadata')}
                            {expandedSections.has('metadata') && (
                                <div className="properties-panel__section">
                                    <PropertyInput
                                        label="Name"
                                        value={
                                            (
                                                singleModule.metadata as {
                                                    name?: string;
                                                }
                                            ).name || ''
                                        }
                                        onChange={(v) =>
                                            handleSingleChange('metadata', {
                                                ...singleModule.metadata,
                                                name: String(v),
                                            })
                                        }
                                    />
                                    {(
                                        singleModule.metadata as {
                                            capacity?: number;
                                        }
                                    ).capacity !== undefined && (
                                            <PropertyInput
                                                label="Capacity"
                                                type="number"
                                                value={
                                                    (
                                                        singleModule.metadata as {
                                                            capacity?: number;
                                                        }
                                                    ).capacity
                                                }
                                                onChange={(v) =>
                                                    handleSingleChange('metadata', {
                                                        ...singleModule.metadata,
                                                        capacity: Number(v),
                                                    })
                                                }
                                            />
                                        )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Layer Section */}
                    {renderSectionHeader('Layer', 'layer')}
                    {expandedSections.has('layer') && (
                        <div className="properties-panel__section">
                            <PropertyInput
                                label="Z-Index"
                                type="number"
                                value={singleModule?.zIndex}
                                mixed={isMixed('zIndex')}
                                onChange={(v) =>
                                    handleMultiChange('zIndex', Number(v))
                                }
                            />
                            <PropertyInput
                                label="Locked"
                                type="checkbox"
                                value={singleModule?.locked}
                                mixed={isMixed('locked')}
                                onChange={(v) =>
                                    handleMultiChange('locked', Boolean(v))
                                }
                            />
                            <PropertyInput
                                label="Visible"
                                type="checkbox"
                                value={singleModule?.visible}
                                mixed={isMixed('visible')}
                                onChange={(v) =>
                                    handleMultiChange('visible', Boolean(v))
                                }
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PropertiesPanel;
