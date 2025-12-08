/**
 * Command Interface
 * Base interface for all commands supporting undo/redo
 */

export interface Command {
    readonly name: string;
    execute(): void;
    undo(): void;
}
