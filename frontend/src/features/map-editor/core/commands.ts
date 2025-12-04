/**
 * Command Pattern Interfaces
 * Defines the command interface for undoable operations
 */

/**
 * Base command interface
 */
export interface Command {
  /**
   * Execute the command
   */
  execute(): void | Promise<void>;

  /**
   * Undo the command
   */
  undo(): void | Promise<void>;

  /**
   * Check if the command can be executed
   */
  canExecute(): boolean;

  /**
   * Human-readable description of the command
   */
  description: string;

  /**
   * Optional: Group commands together (e.g., for batch operations)
   */
  groupId?: string;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  error?: Error;
}

/**
 * Command metadata
 */
export interface CommandMetadata {
  timestamp: number;
  description: string;
  groupId?: string;
}

