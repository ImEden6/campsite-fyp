/**
 * useMapCommands Hook
 * Hook for executing commands
 */

import { useCallback, useState, useEffect } from 'react';
import { useMapEditor } from './useMapEditor';
import { MoveModuleCommand } from '../commands/MoveModuleCommand';
import { ResizeModuleCommand } from '../commands/ResizeModuleCommand';
import { RotateModuleCommand } from '../commands/RotateModuleCommand';
import { AddModuleCommand } from '../commands/AddModuleCommand';
import { DeleteModuleCommand } from '../commands/DeleteModuleCommand';
import { BulkOperationCommand, type BulkOperation } from '../commands/BulkOperationCommand';
import type { Position, Size, AnyModule } from '@/types';

/**
 * Hook for executing map editor commands
 */
export function useMapCommands() {
  const { commandBus, mapService, historyService, eventBus } = useMapEditor();

  const moveModule = useCallback(
    async (
      mapId: string,
      moduleId: string,
      newPosition: Position,
      oldPosition: Position,
      groupId?: string
    ) => {
      const command = new MoveModuleCommand(
        mapService,
        mapId,
        moduleId,
        newPosition,
        oldPosition,
        groupId
      );
      return commandBus.execute(command);
    },
    [commandBus, mapService]
  );

  const resizeModule = useCallback(
    async (
      mapId: string,
      moduleId: string,
      newSize: Size,
      oldSize: Size,
      groupId?: string
    ) => {
      const command = new ResizeModuleCommand(
        mapService,
        mapId,
        moduleId,
        newSize,
        oldSize,
        groupId
      );
      return commandBus.execute(command);
    },
    [commandBus, mapService]
  );

  const rotateModule = useCallback(
    async (
      mapId: string,
      moduleId: string,
      newRotation: number,
      oldRotation: number,
      groupId?: string
    ) => {
      const command = new RotateModuleCommand(
        mapService,
        mapId,
        moduleId,
        newRotation,
        oldRotation,
        groupId
      );
      return commandBus.execute(command);
    },
    [commandBus, mapService]
  );

  const addModule = useCallback(
    async (mapId: string, module: AnyModule, groupId?: string) => {
      const command = new AddModuleCommand(mapService, mapId, module, groupId);
      return commandBus.execute(command);
    },
    [commandBus, mapService]
  );

  const deleteModules = useCallback(
    async (mapId: string, moduleIds: string[], groupId?: string) => {
      const command = new DeleteModuleCommand(
        mapService,
        mapId,
        moduleIds,
        groupId
      );
      return commandBus.execute(command);
    },
    [commandBus, mapService]
  );

  const bulkOperation = useCallback(
    async (mapId: string, operation: BulkOperation, groupId?: string) => {
      const command = new BulkOperationCommand(
        mapService,
        mapId,
        operation,
        groupId
      );
      return commandBus.execute(command);
    },
    [commandBus, mapService]
  );

  // Track history state to trigger recomputation of canUndo/canRedo
  const [historyVersion, setHistoryVersion] = useState(0);

  const undo = useCallback(async () => {
    await historyService.undo();
    // Update version to trigger recomputation of canUndo/canRedo
    setHistoryVersion((v) => v + 1);
  }, [historyService]);

  const redo = useCallback(async () => {
    await historyService.redo();
    // Update version to trigger recomputation of canUndo/canRedo
    setHistoryVersion((v) => v + 1);
  }, [historyService]);

  // Update history version when commands are executed (via eventBus)
  useEffect(() => {
    // Listen to command execution events to update canUndo/canRedo
    // Since commands are executed through commandBus, we need to check periodically
    // or listen to module events that indicate state changes
    const checkHistory = () => {
      setHistoryVersion((v) => v + 1);
    };

    // Listen to module events that indicate commands were executed
    const unsubscribeModule = eventBus.on('module:add', checkHistory);
    const unsubscribeModuleUpdate = eventBus.on('module:update', checkHistory);
    const unsubscribeModuleDelete = eventBus.on('module:delete', checkHistory);

    return () => {
      unsubscribeModule();
      unsubscribeModuleUpdate();
      unsubscribeModuleDelete();
    };
  }, [eventBus]);

  // Compute canUndo and canRedo dynamically based on current history state
  // The historyVersion dependency ensures these are recomputed when history changes
  const canUndo = historyService.canUndo();
  const canRedo = historyService.canRedo();

  return {
    moveModule,
    resizeModule,
    rotateModule,
    addModule,
    deleteModules,
    bulkOperation,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

