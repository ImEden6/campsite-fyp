/**
 * Properties Panel
 * Enhanced panel displaying and editing properties of selected modules.
 * Supports single-select full editing, multi-select common properties,
 * module-specific property sections, and quick actions with inline delete.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    X,
    // Lock, Unlock, Eye, EyeOff - TODO: Re-enable when implementing lock/visibility options
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Copy,
    Trash2,
    RotateCw,
} from 'lucide-react';
import type { AnyModule, CampsiteModule, BuildingModule, RoadModule, CustomModule } from '@/types';
import { useEditorStore } from '@/stores';
import { useMapStore } from '@/stores/mapStore';
import { PropertyCommand, type PropertyChange } from '@/commands/PropertyCommand';
import { AddCommand } from '@/commands/AddCommand';
import { DeleteCommand } from '@/commands/DeleteCommand';
import type { Command } from '@/commands/Command';
import { createNewModule } from '@/utils/moduleFactory';
import {
    getModuleIcon,
    CampsiteProperties,
    BuildingProperties,
    RoadProperties,
    CustomProperties,
} from './properties';

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
    onBlur?: () => void;
    error?: string;
    valid?: boolean;
}

export interface PropertiesPanelProps {
    onClose?: () => void;
    executeCommand: (command: Command) => void;
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
    onBlur,
    error,
    valid,
}: PropertyInputProps) {
    const id = `prop-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const fieldClass = `properties-panel__field ${error ? 'properties-panel__field--error' : valid ? 'properties-panel__field--valid' : ''}`;

    // Format display value: round numbers to 1 decimal for display, but keep internal precision
    const displayValue = useMemo(() => {
        if (mixed) return '';
        if (typeof value === 'number') {
            // Round to 1 decimal for display
            return Math.round(value * 10) / 10;
        }
        if (typeof value === 'boolean') return String(value);
        return value ?? '';
    }, [value, mixed]);

    // Use local state for controlled input to prevent value reset issues
    const [localValue, setLocalValue] = useState<string | number>(displayValue);
    const isFocusedRef = useRef(false);

    // Update local value when displayValue changes (but not when user is typing)
    useEffect(() => {
        if (!isFocusedRef.current) {
            setLocalValue(displayValue);
        }
    }, [displayValue]);

    if (type === 'checkbox') {
        return (
            <label className="properties-panel__field properties-panel__field--checkbox">
                <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                    }}
                    onFocus={(e) => {
                        e.stopPropagation();
                    }}
                />
                <span>{label}</span>
            </label>
        );
    }

    return (
        <div className={fieldClass}>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type={type}
                value={localValue}
                placeholder={mixed ? 'Mixed' : undefined}
                disabled={disabled}
                step={type === 'number' ? 'any' : undefined}
                onChange={(e) => {
                    const newValue = type === 'number'
                        ? (e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        : e.target.value;
                    setLocalValue(newValue);
                    onChange(newValue);
                }}
                onBlur={() => {
                    // Sync with displayValue on blur
                    isFocusedRef.current = false;
                    setLocalValue(displayValue);
                    if (onBlur) onBlur();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    // Ensure input can receive focus
                    e.currentTarget.focus();
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    // Select all text on double click
                    e.currentTarget.select();
                }}
                onMouseDown={(e) => {
                    // Only stop propagation, don't prevent default focus behavior
                    e.stopPropagation();
                }}
                onFocus={(e) => {
                    e.stopPropagation();
                    isFocusedRef.current = true;
                }}
                onKeyDown={(e) => {
                    // Stop propagation to prevent canvas keyboard handlers from interfering
                    e.stopPropagation();
                    // Allow normal input behavior
                }}
                onKeyPress={(e) => {
                    // Stop propagation to prevent canvas keyboard handlers from interfering
                    e.stopPropagation();
                    // Allow normal input behavior - don't prevent default
                }}
                onKeyUp={(e) => {
                    // Stop propagation to prevent canvas keyboard handlers from interfering
                    e.stopPropagation();
                    // Allow normal input behavior - don't prevent default
                }}
            />
            {error && <p className="properties-panel__field-error">{error}</p>}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PropertiesPanel({ onClose, executeCommand }: PropertiesPanelProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['transform', 'metadata'])
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { selectedIds, setSelection } = useEditorStore();
    // TODO: Rethink locked and visibility functionality - prepare for future options
    // const { toggleModuleVisibility, toggleModuleLock, isModuleHidden, isModuleLocked } = useEditorStore();

    // Subscribe to currentMap to reactively update when modules change
    const currentMap = useMapStore((state) => state.currentMap);

    // Get selected modules reactively from currentMap
    const selectedModules = useMemo(() => {
        if (!currentMap) return [];
        return selectedIds
            .map((id) => currentMap.modules.find((m) => m.id === id))
            .filter((m): m is AnyModule => m !== undefined);
    }, [selectedIds, currentMap]);

    const singleModule = selectedModules.length === 1 ? selectedModules[0] : null;
    const hasSelection = selectedModules.length > 0;
    const isMultiSelect = selectedModules.length > 1;

    // Check if all selected modules are the same type
    const allSameType = selectedModules.length > 0 &&
        selectedModules.every(m => m.type === selectedModules[0]?.type);

    // Reset delete confirm when selection changes
    useEffect(() => {
        setShowDeleteConfirm(false);
        // Clear any pending debounce timers when selection changes
        debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
        debounceTimersRef.current.clear();
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

    // Debounce timers for real-time updates
    const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const isMountedRef = useRef(true);

    // Cleanup debounce timers on unmount
    useEffect(() => {
        isMountedRef.current = true;
        const timers = debounceTimersRef.current;
        return () => {
            isMountedRef.current = false;
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    // Apply property change immediately (with debouncing for text/number inputs)
    const applyChange = useCallback(
        (moduleId: string, key: string, value: unknown, immediate = false) => {
            const module = currentMap?.modules.find((m) => m.id === moduleId);
            if (!module) return;

            const timerKey = `${moduleId}-${key}`;
            const existingTimer = debounceTimersRef.current.get(timerKey);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const executeChange = () => {
                // Prevent execution after unmount
                if (!isMountedRef.current) return;

                const currentModule = currentMap?.modules.find((m) => m.id === moduleId);
                if (!currentModule) return;

                // Preserve current selection before executing command
                const selectedIdsToPreserve = [...selectedIds];

                const oldProps: Record<string, unknown> = {
                    [key]: currentModule[key as keyof AnyModule],
                };
                const newProps: Record<string, unknown> = {
                    [key]: value,
                };

                executeCommand(new PropertyCommand([{
                    moduleId,
                    oldProps,
                    newProps,
                }]));

                // Restore selection after command execution
                requestAnimationFrame(() => {
                    if (isMountedRef.current) {
                        setSelection(selectedIdsToPreserve);
                    }
                });

                debounceTimersRef.current.delete(timerKey);
            };

            if (immediate) {
                executeChange();
            } else {
                // Debounce text/number inputs by 300ms for better UX
                const timer = setTimeout(executeChange, 300);
                debounceTimersRef.current.set(timerKey, timer);
            }
        },
        [currentMap, executeCommand, selectedIds, setSelection]
    );

    // Handle input change for single module
    const handleSingleChange = useCallback(
        (key: keyof AnyModule, value: unknown, immediate = false) => {
            if (!singleModule) return;
            applyChange(singleModule.id, key, value, immediate);
        },
        [singleModule, applyChange]
    );

    // Handle multi-select change (apply delta to all)
    const handleMultiChange = useCallback(
        (key: keyof AnyModule, value: unknown, immediate = false) => {
            selectedModules.forEach((module) => {
                applyChange(module.id, key, value, immediate);
            });
        },
        [selectedModules, applyChange]
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

    // Handle metadata update for module-specific components
    const handleMetadataUpdate = useCallback(
        (changes: Record<string, unknown>) => {
            if (!singleModule) return;

            const currentModule = currentMap?.modules.find((m) => m.id === singleModule.id);
            if (!currentModule) return;

            // Preserve current selection before executing command
            const selectedIdsToPreserve = [...selectedIds];

            const newMetadata = {
                ...currentModule.metadata,
                ...changes,
            };

            executeCommand(new PropertyCommand([{
                moduleId: singleModule.id,
                oldProps: { metadata: currentModule.metadata },
                newProps: { metadata: newMetadata },
            } as PropertyChange]));

            // Restore selection after command execution
            requestAnimationFrame(() => {
                setSelection(selectedIdsToPreserve);
            });
        },
        [singleModule, currentMap, executeCommand, selectedIds, setSelection]
    );

    // Handle delete with inline confirmation
    const handleDeleteClick = useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        // Delete modules using DeleteCommand
        const modulesToDelete = selectedModules.filter((m): m is AnyModule => m !== undefined);
        if (modulesToDelete.length > 0) {
            executeCommand(new DeleteCommand(modulesToDelete));
            setSelection([]); // Clear selection after delete
        }
        setShowDeleteConfirm(false);
    }, [selectedModules, executeCommand, setSelection]);

    const handleDeleteCancel = useCallback(() => {
        setShowDeleteConfirm(false);
    }, []);

    // Handle duplicate
    const handleDuplicate = useCallback(() => {
        // Duplicate selected modules using AddCommand
        const duplicatedModules = selectedModules.map((module) => {
            const newModule = createNewModule(module.type, {
                x: module.position.x + 20,
                y: module.position.y + 20,
            });
            // Copy metadata from original
            return {
                ...newModule,
                metadata: { ...module.metadata },
                size: { ...module.size },
                rotation: module.rotation,
                zIndex: module.zIndex + 1,
            } as AnyModule;
        });

        if (duplicatedModules.length > 0) {
            executeCommand(new AddCommand(duplicatedModules));
            // Select the new modules
            setSelection(duplicatedModules.map((m) => m.id));
        }
    }, [selectedModules, executeCommand, setSelection]);

    // Handle rotate by 90 degrees - directly execute command to avoid async state issues
    const handleRotate90 = useCallback(() => {
        if (selectedModules.length === 0) return;

        // Store selected IDs to preserve selection (capture current value)
        const selectedIdsToPreserve = selectedModules.map(m => m.id);

        const changes: PropertyChange[] = selectedModules.map((module) => {
            const newRotation = (module.rotation + 90) % 360;
            return {
                moduleId: module.id,
                oldProps: { rotation: module.rotation },
                newProps: { rotation: newRotation },
            };
        });

        if (changes.length > 0) {
            executeCommand(new PropertyCommand(changes));
            // Ensure selection is maintained after command execution
            // Use setTimeout to ensure command has been processed
            // Use requestAnimationFrame for better timing with React updates
            requestAnimationFrame(() => {
                setSelection(selectedIdsToPreserve);
            });
        }
    }, [selectedModules, executeCommand, setSelection]);

    // Handle reset rotation - directly execute command to avoid async state issues
    const handleResetRotation = useCallback(() => {
        if (selectedModules.length === 0) return;

        const changes: PropertyChange[] = [];
        selectedModules.forEach((module) => {
            const currentModule = currentMap?.modules.find((m) => m.id === module.id);
            if (!currentModule) return;
            changes.push({
                moduleId: module.id,
                oldProps: { rotation: currentModule.rotation ?? 0 },
                newProps: { rotation: 0 },
            });
        });

        if (changes.length > 0) {
            executeCommand(new PropertyCommand(changes));
        }
    }, [selectedModules, currentMap, executeCommand]);

    // Render section header
    const renderSectionHeader = (title: string, key: string) => (
        <button
            className="properties-panel__section-header"
            onClick={() => toggleSection(key)}
            aria-expanded={expandedSections.has(key)}
            aria-label={`${expandedSections.has(key) ? 'Collapse' : 'Expand'} ${title} section`}
        >
            <span>{title}</span>
            {expandedSections.has(key) ? (
                <ChevronUp size={16} />
            ) : (
                <ChevronDown size={16} />
            )}
        </button>
    );

    // Render module-specific properties
    const renderModuleProperties = () => {
        if (!singleModule) return null;

        switch (singleModule.type) {
            case 'campsite':
                return (
                    <CampsiteProperties
                        module={singleModule as CampsiteModule}
                        onUpdate={handleMetadataUpdate}
                    />
                );
            case 'building':
                return (
                    <BuildingProperties
                        module={singleModule as BuildingModule}
                        onUpdate={handleMetadataUpdate}
                    />
                );
            case 'road':
                return (
                    <RoadProperties
                        module={singleModule as RoadModule}
                        onUpdate={handleMetadataUpdate}
                    />
                );
            case 'custom':
                return (
                    <CustomProperties
                        module={singleModule as CustomModule}
                        onUpdate={handleMetadataUpdate}
                    />
                );
            default:
                // Fallback for other module types (basic name/capacity)
                return renderBasicMetadata();
        }
    };

    // Render basic metadata for unsupported module types
    const renderBasicMetadata = () => {
        if (!singleModule) return null;

        return (
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
                            onChange={(v) => {
                                const currentModule = currentMap?.modules.find((m) => m.id === singleModule.id);
                                if (!currentModule) return;
                                handleMetadataUpdate({ name: String(v) });
                            }}
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
                                    onChange={(v) => {
                                        const currentModule = currentMap?.modules.find((m) => m.id === singleModule.id);
                                        if (!currentModule) return;
                                        handleMetadataUpdate({ capacity: Number(v) });
                                    }}
                                />
                            )}
                    </div>
                )}
            </>
        );
    };

    // Get module icon config if single selection
    const moduleIconConfig = singleModule ? getModuleIcon(singleModule.type) : null;

    return (
        <div
            className="properties-panel"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            {/* Header with module icon */}
            <div className="properties-panel__header">
                <div className="properties-panel__header-info">
                    {moduleIconConfig && (
                        <div
                            className="properties-panel__module-icon"
                            style={{ backgroundColor: moduleIconConfig.color }}
                        >
                            <moduleIconConfig.icon size={14} />
                        </div>
                    )}
                    <h3 className="properties-panel__title">
                        {isMultiSelect
                            ? `${selectedModules.length} Selected${allSameType ? ` (${selectedModules[0]?.type})` : ''}`
                            : singleModule
                                ? moduleIconConfig?.label || singleModule.type.replace('_', ' ')
                                : 'Properties'}
                    </h3>
                </div>
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
                <>
                    <div className="properties-panel__content">
                        {/* Quick Actions (rotate) */}
                        <div className="properties-panel__actions">
                            {/* TODO: Lock/Visibility functionality - prepare for future options */}
                            {/* <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement lock functionality with options
                                }}
                                title="Lock module"
                                aria-label="Lock module"
                            >
                                <Lock size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement visibility functionality with options
                                }}
                                title="Hide module"
                                aria-label="Hide module"
                            >
                                <Eye size={16} />
                            </button> */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    // Prevent focus change
                                    e.currentTarget.blur();
                                    handleRotate90();
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                                onFocus={(e) => {
                                    // Immediately blur to prevent focus
                                    e.currentTarget.blur();
                                }}
                                title="Rotate 90 degrees"
                                aria-label="Rotate module 90 degrees counterclockwise"
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

                        {/* Module-Specific Properties */}
                        {renderModuleProperties()}

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
                                {/* TODO: Locked/Visible functionality - prepare for future options */}
                                {/* <PropertyInput
                                    label="Locked"
                                    type="checkbox"
                                    value={singleModule?.locked}
                                    mixed={isMixed('locked')}
                                    onChange={(v) =>
                                        handleMultiChange('locked', Boolean(v), true)
                                    }
                                />
                                <PropertyInput
                                    label="Visible"
                                    type="checkbox"
                                    value={singleModule?.visible}
                                    mixed={isMixed('visible')}
                                    onChange={(v) =>
                                        handleMultiChange('visible', Boolean(v), true)
                                    }
                                /> */}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions at Bottom */}
                    <div className="properties-panel__quick-actions">
                        <button
                            className="properties-panel__action--secondary"
                            onClick={handleDuplicate}
                            title="Duplicate"
                            aria-label="Duplicate selected module"
                        >
                            <Copy size={14} />
                            <span>Duplicate</span>
                        </button>
                        <button
                            className="properties-panel__action--secondary"
                            onClick={handleResetRotation}
                            title="Reset to Defaults"
                            aria-label="Reset module properties to defaults"
                        >
                            <RotateCw size={14} />
                            <span>Reset</span>
                        </button>
                        {showDeleteConfirm ? (
                            <div className="properties-panel__delete-confirm">
                                <span>Are you sure?</span>
                                <button
                                    className="properties-panel__delete-confirm-yes"
                                    onClick={handleDeleteConfirm}
                                    aria-label="Confirm delete"
                                >
                                    Yes
                                </button>
                                <button
                                    className="properties-panel__delete-confirm-no"
                                    onClick={handleDeleteCancel}
                                    aria-label="Cancel delete"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <button
                                className="properties-panel__action--destructive"
                                onClick={handleDeleteClick}
                                title="Delete"
                                aria-label="Delete selected module"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default PropertiesPanel;
