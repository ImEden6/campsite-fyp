/**
 * AccessibilityLayer Component
 * Provides DOM-based accessibility layer for canvas content
 * Since Konva renders to canvas, we need a separate DOM layer for screen readers
 * 
 * This layer:
 * - Renders invisible DOM elements for each module
 * - Provides keyboard navigation (Tab, Arrow keys)
 * - Handles click events to sync with canvas
 * - Provides ARIA labels and live regions for screen readers
 * - Manages focus for keyboard users
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useEditorService } from '../../hooks/useEditorService';
import { announce } from '@/utils/accessibility';
import type { AnyModule } from '@/types';

interface AccessibilityLayerProps {
  modules: AnyModule[];
  selectedIds: string[];
  focusedModuleId?: string;
  onModuleFocus?: (moduleId: string | undefined) => void;
  onModuleSelect?: (moduleId: string, multiSelect?: boolean) => void;
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
      ? String(module.metadata.name)
      : 'Unnamed';
  
  const states: string[] = [];
  if (selectedIds.includes(module.id)) states.push('selected');
  if (module.locked) states.push('locked');
  if (!module.visible) states.push('hidden');
  
  // Add position and size info for context
  const position = `at position ${Math.round(module.position.x)}, ${Math.round(module.position.y)}`;
  const size = `${Math.round(module.size.width)} by ${Math.round(module.size.height)}`;
  
  let label = `${type} module "${name}", ${position}, size ${size}`;
  if (states.length > 0) {
    label += `, ${states.join(', ')}`;
  }
  
  return label;
}

/**
 * Generate detailed description for a module
 */
function generateModuleDescription(module: AnyModule): string {
  const parts: string[] = [];
  
  if (module.metadata) {
    if ('capacity' in module.metadata && module.metadata.capacity) {
      parts.push(`Capacity: ${module.metadata.capacity}`);
    }
    if ('amenities' in module.metadata && Array.isArray(module.metadata.amenities)) {
      const amenities = module.metadata.amenities.filter(Boolean);
      if (amenities.length > 0) {
        parts.push(`Amenities: ${amenities.join(', ')}`);
      }
    }
    if ('pricing' in module.metadata && module.metadata.pricing) {
      const pricing = module.metadata.pricing;
      if ('basePrice' in pricing) {
        parts.push(`Base price: $${pricing.basePrice}`);
      }
    }
  }
  
  if (module.rotation && module.rotation !== 0) {
    parts.push(`Rotated ${Math.round(module.rotation)} degrees`);
  }
  
  return parts.length > 0 ? parts.join('. ') : 'No additional details';
}

/**
 * AccessibilityLayer Component
 * Renders invisible DOM elements for screen readers with full keyboard support
 */
export const AccessibilityLayer: React.FC<AccessibilityLayerProps> = React.memo(
  ({ modules, selectedIds, focusedModuleId, onModuleFocus, onModuleSelect }) => {
    const { eventBus } = useMapEditor();
    const { currentTool } = useEditorService();
    const moduleRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    
    // Handle module click - sync with canvas
    const handleModuleClick = useCallback(
      (e: React.MouseEvent, moduleId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const multiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
        
        // Emit event to sync with canvas
        eventBus.emit('module:select', { moduleId, multiSelect });
        
        // Call callback if provided
        if (onModuleSelect) {
          onModuleSelect(moduleId, multiSelect);
        }
        
        const module = modules.find(m => m.id === moduleId);
        const moduleName = module?.metadata && 'name' in module.metadata
          ? String(module.metadata.name)
          : 'module';
        announce(`Selected ${moduleName}`);
      },
      [eventBus, modules, onModuleSelect]
    );
    
    // Handle module focus
    const handleModuleFocus = useCallback(
      (moduleId: string) => {
        if (onModuleFocus) {
          onModuleFocus(moduleId);
        }
        
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          const label = generateAriaLabel(module, selectedIds);
          announce(`Focused: ${label}`);
        }
      },
      [modules, selectedIds, onModuleFocus]
    );
    
    // Handle keyboard navigation on module elements
    const handleModuleKeyDown = useCallback(
      (e: React.KeyboardEvent, moduleId: string, index: number) => {
        // Arrow keys: Navigate between modules
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          
          const currentModule = modules[index];
          if (!currentModule) return;
          
          let nextIndex = index;
          
          if (e.key === 'ArrowUp') {
            // Find module above
            const candidates = modules
              .map((m, idx) => ({ module: m, idx, y: m.position.y }))
              .filter((item) => item.y < currentModule.position.y)
              .sort((a, b) => b.y - a.y);
            nextIndex = candidates[0]?.idx ?? index;
          } else if (e.key === 'ArrowDown') {
            // Find module below
            const candidates = modules
              .map((m, idx) => ({ module: m, idx, y: m.position.y }))
              .filter((item) => item.y > currentModule.position.y)
              .sort((a, b) => a.y - b.y);
            nextIndex = candidates[0]?.idx ?? index;
          } else if (e.key === 'ArrowLeft') {
            // Find module to the left
            const candidates = modules
              .map((m, idx) => ({ module: m, idx, x: m.position.x }))
              .filter((item) => item.x < currentModule.position.x)
              .sort((a, b) => b.x - a.x);
            nextIndex = candidates[0]?.idx ?? index;
          } else if (e.key === 'ArrowRight') {
            // Find module to the right
            const candidates = modules
              .map((m, idx) => ({ module: m, idx, x: m.position.x }))
              .filter((item) => item.x > currentModule.position.x)
              .sort((a, b) => a.x - b.x);
            nextIndex = candidates[0]?.idx ?? index;
          }
          
          const nextModule = modules[nextIndex];
          if (nextModule && nextIndex !== index) {
            const nextElement = moduleRefs.current.get(nextModule.id);
            if (nextElement) {
              nextElement.focus();
              handleModuleFocus(nextModule.id);
            }
          }
        }
        
        // Enter/Space: Select module
        if ((e.key === 'Enter' || e.key === ' ') && currentTool === 'select') {
          e.preventDefault();
          e.stopPropagation();
          // Create a synthetic mouse event for keyboard activation
          const syntheticEvent = {
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation(),
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          } as React.MouseEvent;
          handleModuleClick(syntheticEvent, moduleId);
        }
      },
      [modules, currentTool, handleModuleClick, handleModuleFocus]
    );
    
    // Focus the focused module element when focusedModuleId changes
    useEffect(() => {
      if (focusedModuleId) {
        const element = moduleRefs.current.get(focusedModuleId);
        if (element) {
          element.focus();
        }
      }
    }, [focusedModuleId]);
    
    // Announce selection changes
    useEffect(() => {
      if (selectedIds.length > 0) {
        const moduleNames = selectedIds
          .map((id) => {
            const module = modules.find((m) => m.id === id);
            if (!module) return null;
            return module.metadata && 'name' in module.metadata
              ? String(module.metadata.name)
              : 'Unnamed module';
          })
          .filter(Boolean)
          .join(', ');
        
        announce(
          `${selectedIds.length} module${selectedIds.length > 1 ? 's' : ''} selected: ${moduleNames}`
        );
      }
    }, [selectedIds, modules]);
    
    // Filter visible modules only
    const visibleModules = modules.filter(m => m.visible !== false);
    
    return (
      <>
        {/* Module list for screen readers */}
        <div
          className="sr-only"
          role="list"
          aria-label={`Map canvas with ${visibleModules.length} module${visibleModules.length !== 1 ? 's' : ''}`}
        >
          {visibleModules.map((module, index) => {
            const isSelected = selectedIds.includes(module.id);
            const isFocused = focusedModuleId === module.id;
            const ariaLabel = generateAriaLabel(module, selectedIds);
            const description = generateModuleDescription(module);
            
            return (
              <button
                key={module.id}
                ref={(el) => {
                  if (el) {
                    moduleRefs.current.set(module.id, el);
                  } else {
                    moduleRefs.current.delete(module.id);
                  }
                }}
                role="listitem"
                aria-label={ariaLabel}
                aria-describedby={description ? `module-desc-${module.id}` : undefined}
                aria-selected={isSelected}
                aria-current={isFocused ? 'true' : undefined}
                tabIndex={isFocused ? 0 : -1}
                onClick={(e) => handleModuleClick(e, module.id)}
                onFocus={() => handleModuleFocus(module.id)}
                onKeyDown={(e) => handleModuleKeyDown(e, module.id, index)}
                className="sr-only"
                style={{
                  position: 'absolute',
                  // Position to match canvas (even though invisible)
                  // This helps screen readers understand spatial relationships
                  left: `${module.position.x}px`,
                  top: `${module.position.y}px`,
                  width: `${module.size.width}px`,
                  height: `${module.size.height}px`,
                }}
              >
                {/* Hidden description for screen readers */}
                {description && (
                  <span id={`module-desc-${module.id}`} className="sr-only">
                    {description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </>
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

