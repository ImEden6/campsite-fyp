/**
 * Module Toolbox
 * Collapsible palette showing available module types.
 * Supports click-to-add and drag-and-drop to canvas.
 */

import React, { useState, useCallback } from 'react';
import {
    Tent,
    Bath,
    Car,
    Building2,
    Route,
    Droplet,
    Zap,
    Trash2,
    TreePine,
    Package,
    Plus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import type { ModuleType } from '@/types';
import { useEditorStore } from '@/stores';
import { getModuleColor } from '@/utils/moduleFactory';

// ============================================================================
// TYPES
// ============================================================================

interface ModuleTemplate {
    type: ModuleType;
    label: string;
    icon: React.ElementType;
    description: string;
}

interface ModuleToolboxProps {
    onAddModule?: (type: ModuleType) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODULE_TEMPLATES: ModuleTemplate[] = [
    {
        type: 'campsite',
        label: 'Campsite',
        icon: Tent,
        description: 'Camping spot for guests',
    },
    {
        type: 'toilet',
        label: 'Toilet',
        icon: Bath,
        description: 'Restroom facilities',
    },
    {
        type: 'parking',
        label: 'Parking',
        icon: Car,
        description: 'Vehicle parking area',
    },
    {
        type: 'building',
        label: 'Building',
        icon: Building2,
        description: 'Building or structure',
    },
    {
        type: 'road',
        label: 'Road',
        icon: Route,
        description: 'Road or pathway',
    },
    {
        type: 'water_source',
        label: 'Water',
        icon: Droplet,
        description: 'Water source or tap',
    },
    {
        type: 'electricity',
        label: 'Electric',
        icon: Zap,
        description: 'Power hookup',
    },
    {
        type: 'waste_disposal',
        label: 'Waste',
        icon: Trash2,
        description: 'Waste disposal area',
    },
    {
        type: 'recreation',
        label: 'Recreation',
        icon: TreePine,
        description: 'Recreation area',
    },
    {
        type: 'storage',
        label: 'Storage',
        icon: Package,
        description: 'Storage unit',
    },
    {
        type: 'custom',
        label: 'Custom',
        icon: Plus,
        description: 'Custom module',
    },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ModuleToolbox({ onAddModule }: ModuleToolboxProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const { moduleToAdd, setModuleToAdd, activeTool, setActiveTool } =
        useEditorStore();

    const handleModuleClick = useCallback(
        (type: ModuleType) => {
            if (moduleToAdd === type) {
                // Deselect if already selected
                setModuleToAdd(null);
            } else {
                // Select for add-by-click mode
                setModuleToAdd(type);
                setActiveTool('add');
            }

            // Also trigger callback if provided
            onAddModule?.(type);
        },
        [moduleToAdd, setModuleToAdd, setActiveTool, onAddModule]
    );

    const handleDragStart = useCallback(
        (e: React.DragEvent, type: ModuleType) => {
            setIsDragging(true);
            e.dataTransfer.setData('application/x-module-type', type);
            e.dataTransfer.effectAllowed = 'copy';
        },
        []
    );

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

    if (isCollapsed) {
        return (
            <div className="module-toolbox module-toolbox--collapsed">
                <button
                    className="module-toolbox__toggle"
                    onClick={toggleCollapse}
                    aria-label="Expand toolbox"
                    title="Expand toolbox"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`module-toolbox ${isDragging ? 'module-toolbox--dragging' : ''}`}
        >
            <div className="module-toolbox__header">
                <h3 className="module-toolbox__title">Modules</h3>
                <button
                    className="module-toolbox__toggle"
                    onClick={toggleCollapse}
                    aria-label="Collapse toolbox"
                    title="Collapse toolbox"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            <div className="module-toolbox__content">
                <p className="module-toolbox__hint">
                    Click to add or drag to canvas
                </p>

                <div className="module-toolbox__grid">
                    {MODULE_TEMPLATES.map((template) => {
                        const Icon = template.icon;
                        const isSelected = moduleToAdd === template.type;
                        const color = getModuleColor(template.type);

                        return (
                            <button
                                key={template.type}
                                className={`module-toolbox__item ${isSelected ? 'module-toolbox__item--selected' : ''}`}
                                onClick={() => handleModuleClick(template.type)}
                                draggable
                                onDragStart={(e) =>
                                    handleDragStart(e, template.type)
                                }
                                onDragEnd={handleDragEnd}
                                title={template.description}
                                aria-pressed={isSelected}
                                style={
                                    {
                                        '--module-color': color,
                                    } as React.CSSProperties
                                }
                            >
                                <div
                                    className="module-toolbox__item-icon"
                                    style={{ color }}
                                >
                                    <Icon size={24} />
                                </div>
                                <span className="module-toolbox__item-label">
                                    {template.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {activeTool === 'add' && moduleToAdd && (
                    <div className="module-toolbox__status">
                        Click on canvas to place{' '}
                        <strong>
                            {
                                MODULE_TEMPLATES.find(
                                    (t) => t.type === moduleToAdd
                                )?.label
                            }
                        </strong>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ModuleToolbox;
