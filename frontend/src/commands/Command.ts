/**
 * Command Interface
 * Base interface for all editor commands supporting undo/redo.
 */

export interface Command {
    /** Human-readable name for the command (used in UI) */
    readonly name: string;

    /** Execute the command */
    execute(): void;

    /** Undo the command */
    undo(): void;
}
