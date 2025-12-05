/**
 * AccessibilityLayer Component
 * Provides DOM-based accessibility layer for canvas content
 * Since Konva renders to canvas, we need a separate DOM layer for screen readers
 */

import React from 'react';
import type { AnyModule } from '@/types';

interface AccessibilityLayerProps {
  modules: AnyModule[];
  selectedIds: string[];
  focusedModuleId?: string;
}

/**
 * Helper to compare arrays
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Generate ARIA label for a module
 */
function generateAriaLabel(module: AnyModule, selectedIds: string[]): string {
  const type = module.type.replace('_', ' ');
  const name =
    module.metadata && 'name' in module.metadata
      ? module.metadata.name
      : 'Unnamed';
  const states = [];
  if (selectedIds.includes(module.id)) states.push('selected');
  if (module.locked) states.push('locked');
  if (!module.visible) states.push('hidden');

  return `Module: ${type} ${name}${states.length > 0 ? `, ${states.join(', ')}` : ''}`;
}

/**
 * AccessibilityLayer Component
 * Renders invisible DOM elements for screen readers
 */
export const AccessibilityLayer: React.FC<AccessibilityLayerProps> = React.memo(
  ({ modules, selectedIds, focusedModuleId }) => {
    return (
      <div className="sr-only" role="list" aria-label="Map modules">
        {modules.map((module) => (
          <div
            key={module.id}
            role="listitem"
            aria-label={generateAriaLabel(module, selectedIds)}
            aria-selected={selectedIds.includes(module.id)}
            aria-current={focusedModuleId === module.id ? 'true' : undefined}
            tabIndex={-1} // Not directly focusable, managed programmatically
          />
        ))}
      </div>
    );
  },
  (prev, next) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prev.modules === next.modules &&
      arraysEqual(prev.selectedIds, next.selectedIds) &&
      prev.focusedModuleId === next.focusedModuleId
    );
  }
);

AccessibilityLayer.displayName = 'AccessibilityLayer';

