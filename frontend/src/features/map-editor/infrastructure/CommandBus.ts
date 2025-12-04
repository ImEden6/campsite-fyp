/**
 * Command Bus
 * Manages command execution and undo/redo history
 */

import type { Command, CommandResult, CommandMetadata } from '../core/commands';

/**
 * Command Bus implementation with history management
 */
export class CommandBus {
  private undoStack: Array<{ command: Command; metadata: CommandMetadata }> = [];
  private redoStack: Array<{ command: Command; metadata: CommandMetadata }> = [];
  private maxHistorySize: number;
  private currentGroupId: string | null = null;
  private groupCommands: Command[] = [];

  constructor(config: { maxHistorySize?: number } = {}) {
    this.maxHistorySize = config.maxHistorySize ?? 50;
  }

  /**
   * Execute a command
   */
  async execute(command: Command): Promise<CommandResult> {
    if (!command.canExecute()) {
      return {
        success: false,
        error: new Error(`Command cannot be executed: ${command.description}`),
      };
    }

    try {
      // If in a transaction, add to group but don't execute yet
      if (this.currentGroupId !== null) {
        this.groupCommands.push(command);
        // Don't execute here - will be executed when transaction is committed
        return { success: true };
      }

      // Execute command
      await command.execute();

      // Add to undo stack
      const metadata: CommandMetadata = {
        timestamp: Date.now(),
        description: command.description,
        groupId: command.groupId,
      };

      this.undoStack.push({ command, metadata });

      // Limit stack size
      if (this.undoStack.length > this.maxHistorySize) {
        this.undoStack.shift();
      }

      // Clear redo stack when new command is executed
      this.redoStack = [];

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Undo the last command
   */
  async undo(): Promise<CommandResult> {
    if (!this.canUndo()) {
      return {
        success: false,
        error: new Error('Nothing to undo'),
      };
    }

    try {
      const { command, metadata } = this.undoStack.pop()!;
      await command.undo();
      
      // Move to redo stack
      this.redoStack.push({ command, metadata });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Redo the last undone command
   */
  async redo(): Promise<CommandResult> {
    if (!this.canRedo()) {
      return {
        success: false,
        error: new Error('Nothing to redo'),
      };
    }

    try {
      const { command, metadata } = this.redoStack.pop()!;
      await command.execute();
      
      // Move back to undo stack
      this.undoStack.push({ command, metadata });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Start a transaction (group commands)
   */
  beginTransaction(groupId: string): void {
    if (this.currentGroupId !== null) {
      throw new Error('Transaction already in progress');
    }
    this.currentGroupId = groupId;
    this.groupCommands = [];
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(): Promise<CommandResult> {
    if (this.currentGroupId === null) {
      return {
        success: false,
        error: new Error('No transaction in progress'),
      };
    }

    const groupId = this.currentGroupId;
    const commands = [...this.groupCommands];
    
    this.currentGroupId = null;
    this.groupCommands = [];

    // Create a composite command for the group
    const compositeCommand: Command = {
      description: `Transaction: ${groupId}`,
      groupId,
      canExecute: () => true,
      execute: async () => {
        for (const cmd of commands) {
          await cmd.execute();
        }
      },
      undo: async () => {
        // Undo in reverse order
        for (let i = commands.length - 1; i >= 0; i--) {
          const cmd = commands[i];
          if (cmd) {
            await cmd.undo();
          }
        }
      },
    };

    return this.execute(compositeCommand);
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(): Promise<CommandResult> {
    if (this.currentGroupId === null) {
      return {
        success: false,
        error: new Error('No transaction in progress'),
      };
    }

    // Commands queued during a transaction are not executed until commit.
    // On rollback, we simply discard them without undoing, since they were never executed.
    this.currentGroupId = null;
    this.groupCommands = [];

    return { success: true };
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get undo stack size
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get redo stack size
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Get last command description
   */
  getLastCommandDescription(): string | null {
    const last = this.undoStack[this.undoStack.length - 1];
    return last ? last.metadata.description : null;
  }

  /**
   * Get next command description (for redo)
   */
  getNextCommandDescription(): string | null {
    const next = this.redoStack[this.redoStack.length - 1];
    return next ? next.metadata.description : null;
  }
}

/**
 * Create a new CommandBus instance
 */
export function createCommandBus(config?: { maxHistorySize?: number }): CommandBus {
  return new CommandBus(config);
}

