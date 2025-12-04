/**
 * useMapCommands Hook
 * Hook for executing commands
 */

import { useCallback } from 'react';
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
  const { commandBus, mapService, historyService } = useMapEditor();

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

  const undo = useCallback(async () => {
    return historyService.undo();
  }, [historyService]);

  const redo = useCallback(async () => {
    return historyService.redo();
  }, [historyService]);

  return {
    moveModule,
    resizeModule,
    rotateModule,
    addModule,
    deleteModules,
    bulkOperation,
    undo,
    redo,
    canUndo: historyService.canUndo(),
    canRedo: historyService.canRedo(),
  };
}

