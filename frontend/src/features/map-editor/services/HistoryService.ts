/**
 * History Service
 * Implements IHistoryService wrapping CommandBus
 */

import type { IHistoryService } from '../core/services';
import type { CommandBus as ICommandBus } from '../infrastructure/CommandBus';

export class HistoryService implements IHistoryService {
  private commandBus: ICommandBus;

  constructor(commandBus: ICommandBus) {
    this.commandBus = commandBus;
  }

  canUndo(): boolean {
    return this.commandBus.canUndo();
  }

  canRedo(): boolean {
    return this.commandBus.canRedo();
  }

  async undo(): Promise<void> {
    const result = await this.commandBus.undo();
    if (!result.success && result.error) {
      throw result.error;
    }
  }

  async redo(): Promise<void> {
    const result = await this.commandBus.redo();
    if (!result.success && result.error) {
      throw result.error;
    }
  }

  clearHistory(): void {
    this.commandBus.clearHistory();
  }

  getUndoStackSize(): number {
    return this.commandBus.getUndoStackSize();
  }

  getRedoStackSize(): number {
    return this.commandBus.getRedoStackSize();
  }

  getLastCommandDescription(): string | null {
    return this.commandBus.getLastCommandDescription();
  }

  getNextCommandDescription(): string | null {
    return this.commandBus.getNextCommandDescription();
  }
}

