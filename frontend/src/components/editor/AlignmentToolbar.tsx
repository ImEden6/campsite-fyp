/**
 * Alignment Toolbar
 * Provides alignment and distribution tools for multi-select operations.
 */

import { useCallback } from 'react';
import {
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    StretchHorizontal,
    StretchVertical,
} from 'lucide-react';
import type { AnyModule } from '@/types';
import { useEditorStore, useMapStore } from '@/stores';
import { PropertyCommand, type PropertyChange } from '@/commands/PropertyCommand';
import type { Command } from '@/commands/Command';

// ============================================================================
// TYPES
// ============================================================================

type AlignType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';
type DistributeType = 'horizontal' | 'vertical';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AlignmentToolbarProps {
    executeCommand: (command: Command) => void;
}

export function AlignmentToolbar({ executeCommand }: AlignmentToolbarProps) {
    const { selectedIds } = useEditorStore();
    const { getModule } = useMapStore();

    // Get selected modules
    const selectedModules = selectedIds
        .map((id) => getModule(id))
        .filter((m): m is AnyModule => m !== undefined);

    // Only show for multi-select
    if (selectedModules.length < 2) {
        return null;
    }

    // Calculate bounds of all selected modules
    const getBounds = () => {
        const bounds = {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity,
            centerX: 0,
            centerY: 0,
        };

        selectedModules.forEach((m) => {
            bounds.minX = Math.min(bounds.minX, m.position.x);
            bounds.minY = Math.min(bounds.minY, m.position.y);
            bounds.maxX = Math.max(bounds.maxX, m.position.x + m.size.width);
            bounds.maxY = Math.max(bounds.maxY, m.position.y + m.size.height);
        });

        bounds.centerX = (bounds.minX + bounds.maxX) / 2;
        bounds.centerY = (bounds.minY + bounds.maxY) / 2;

        return bounds;
    };

    // Align modules
    const handleAlign = useCallback(
        (type: AlignType) => {
            const bounds = getBounds();
            const changes: PropertyChange[] = [];

            selectedModules.forEach((module) => {
                let newX = module.position.x;
                let newY = module.position.y;

                switch (type) {
                    case 'left':
                        newX = bounds.minX;
                        break;
                    case 'center-h':
                        newX = bounds.centerX - module.size.width / 2;
                        break;
                    case 'right':
                        newX = bounds.maxX - module.size.width;
                        break;
                    case 'top':
                        newY = bounds.minY;
                        break;
                    case 'center-v':
                        newY = bounds.centerY - module.size.height / 2;
                        break;
                    case 'bottom':
                        newY = bounds.maxY - module.size.height;
                        break;
                }

                if (
                    newX !== module.position.x ||
                    newY !== module.position.y
                ) {
                    changes.push({
                        moduleId: module.id,
                        oldProps: { position: { ...module.position } },
                        newProps: { position: { x: newX, y: newY } },
                    });
                }
            });

            if (changes.length > 0) {
                executeCommand(new PropertyCommand(changes));
            }
        },
        [selectedModules, executeCommand]
    );

    // Distribute modules evenly
    const handleDistribute = useCallback(
        (type: DistributeType) => {
            if (selectedModules.length < 3) return;

            const changes: PropertyChange[] = [];

            // Sort by position
            const sorted = [...selectedModules].sort((a, b) =>
                type === 'horizontal'
                    ? a.position.x - b.position.x
                    : a.position.y - b.position.y
            );

            const first = sorted[0];
            const last = sorted[sorted.length - 1];

            // Safety check for TypeScript
            if (!first || !last) return;

            // Calculate total space
            const totalSize =
                type === 'horizontal'
                    ? last.position.x +
                    last.size.width -
                    first.position.x -
                    first.size.width
                    : last.position.y +
                    last.size.height -
                    first.position.y -
                    first.size.height;

            // Calculate gap
            const totalModuleSize = sorted
                .slice(1, -1)
                .reduce(
                    (sum, m) =>
                        sum +
                        (type === 'horizontal' ? m.size.width : m.size.height),
                    0
                );
            const gap = (totalSize - totalModuleSize) / (sorted.length - 1);

            // Position each middle module
            let currentPos =
                type === 'horizontal'
                    ? first.position.x + first.size.width + gap
                    : first.position.y + first.size.height + gap;

            sorted.slice(1, -1).forEach((module) => {
                const newX =
                    type === 'horizontal' ? currentPos : module.position.x;
                const newY =
                    type === 'vertical' ? currentPos : module.position.y;

                if (
                    newX !== module.position.x ||
                    newY !== module.position.y
                ) {
                    changes.push({
                        moduleId: module.id,
                        oldProps: { position: { ...module.position } },
                        newProps: { position: { x: newX, y: newY } },
                    });
                }

                currentPos +=
                    (type === 'horizontal' ? module.size.width : module.size.height) +
                    gap;
            });

            if (changes.length > 0) {
                executeCommand(new PropertyCommand(changes));
            }
        },
        [selectedModules, executeCommand]
    );

    return (
        <div className="alignment-toolbar">
            <span className="alignment-toolbar__label">Align:</span>

            <div className="alignment-toolbar__group">
                <button
                    onClick={() => handleAlign('left')}
                    title="Align left edges"
                    aria-label="Align left edges"
                >
                    <AlignStartVertical size={16} />
                </button>
                <button
                    onClick={() => handleAlign('center-h')}
                    title="Align horizontal centers"
                    aria-label="Align horizontal centers"
                >
                    <AlignCenterVertical size={16} />
                </button>
                <button
                    onClick={() => handleAlign('right')}
                    title="Align right edges"
                    aria-label="Align right edges"
                >
                    <AlignEndVertical size={16} />
                </button>
            </div>

            <div className="alignment-toolbar__separator" />

            <div className="alignment-toolbar__group">
                <button
                    onClick={() => handleAlign('top')}
                    title="Align top edges"
                    aria-label="Align top edges"
                >
                    <AlignStartHorizontal size={16} />
                </button>
                <button
                    onClick={() => handleAlign('center-v')}
                    title="Align vertical centers"
                    aria-label="Align vertical centers"
                >
                    <AlignCenterHorizontal size={16} />
                </button>
                <button
                    onClick={() => handleAlign('bottom')}
                    title="Align bottom edges"
                    aria-label="Align bottom edges"
                >
                    <AlignEndHorizontal size={16} />
                </button>
            </div>

            {selectedModules.length >= 3 && (
                <>
                    <div className="alignment-toolbar__separator" />

                    <span className="alignment-toolbar__label">Distribute:</span>

                    <div className="alignment-toolbar__group">
                        <button
                            onClick={() => handleDistribute('horizontal')}
                            title="Distribute horizontally"
                            aria-label="Distribute horizontally"
                        >
                            <StretchHorizontal size={16} />
                        </button>
                        <button
                            onClick={() => handleDistribute('vertical')}
                            title="Distribute vertically"
                            aria-label="Distribute vertically"
                        >
                            <StretchVertical size={16} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default AlignmentToolbar;
