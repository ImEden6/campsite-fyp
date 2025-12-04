/**
 * Bulk Operations Toolbar
 * Shows when multiple modules are selected, provides bulk operation tools
 */

import React from 'react';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignRight,
  AlignCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapCommands } from '../../hooks/useMapCommands';
import { useMapService } from '../../hooks/useMapService';
import { useToast } from '@/hooks/useToast';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
import type { BulkOperation } from '../../commands/BulkOperationCommand';

interface BulkOperationsToolbarProps {
  mapId: string;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({ mapId }) => {
  const editorService = useEditorService();
  const { bulkOperation } = useMapCommands();
  const mapService = useMapService();
  const { showToast } = useToast();

  const selectedIds = editorService.getSelection();
  const selectedCount = selectedIds.length;

  if (selectedCount < 2) {
    return null;
  }

  const handleBulkLock = async () => {
    const operation: BulkOperation = {
      type: 'lock',
      moduleIds: selectedIds,
    };
    await bulkOperation(mapId, operation);
    showToast(
      `🔒 Locked ${selectedCount} module${selectedCount > 1 ? 's' : ''}`,
      'success',
      EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM
    );
  };

  const handleBulkUnlock = async () => {
    const operation: BulkOperation = {
      type: 'unlock',
      moduleIds: selectedIds,
    };
    await bulkOperation(mapId, operation);
    showToast(
      `🔓 Unlocked ${selectedCount} module${selectedCount > 1 ? 's' : ''}`,
      'success',
      EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM
    );
  };

  const handleBulkVisibility = async (visible: boolean) => {
    const operation: BulkOperation = {
      type: visible ? 'show' : 'hide',
      moduleIds: selectedIds,
    };
    await bulkOperation(mapId, operation);
    showToast(
      `${visible ? '👁️ Shown' : '👁️‍🗨️ Hidden'} ${selectedCount} module${selectedCount > 1 ? 's' : ''}`,
      'success',
      EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM
    );
  };

  const handleAlign = async (alignment: 'left' | 'right' | 'center' | 'top' | 'bottom') => {
    if (selectedCount < 2) {
      showToast('Select at least 2 modules to align', 'warning', EDITOR_CONSTANTS.TOAST_DURATION.SHORT);
      return;
    }

    const operation: BulkOperation = {
      type: 'align',
      moduleIds: selectedIds,
      alignTo: alignment,
    };
    await bulkOperation(mapId, operation);
    showToast(
      `↔️ Aligned ${selectedCount} module${selectedCount > 1 ? 's' : ''} ${alignment}`,
      'success',
      EDITOR_CONSTANTS.TOAST_DURATION.MEDIUM
    );
  };

  const handleClearSelection = () => {
    editorService.clearSelection();
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedCount} modules selected
          </span>

          <div className="h-6 w-px bg-blue-300 dark:bg-blue-700" />

          {/* Lock/Unlock */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleBulkLock}
              aria-label={`Lock all ${selectedCount} selected modules`}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Lock All"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleBulkUnlock}
              aria-label={`Unlock all ${selectedCount} selected modules`}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Unlock All"
            >
              <Unlock className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleBulkVisibility(true)}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Show All"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleBulkVisibility(false)}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Hide All"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-blue-300 dark:bg-blue-700" />

          {/* Alignment Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleAlign('left')}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlign('center')}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Align Center (Horizontal)"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlign('top')}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Align Top"
            >
              <AlignVerticalJustifyStart className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              className="p-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-all"
              title="Align Bottom"
            >
              <AlignVerticalJustifyEnd className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleClearSelection}
          className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 text-sm font-medium"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};

