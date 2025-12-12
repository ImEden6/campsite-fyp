/**
 * Batch Command
 * Groups multiple commands into a single undo step.
 * Useful for multi-select operations and batched property changes.
 */

import type { Command } from './Command';

export class BatchCommand implements Command {
    readonly name: string;
    private readonly commands: Command[];

    /**
     * Create a batch command
     * @param name - Name displayed in undo history
     * @param commands - Array of commands to batch together
     */
    constructor(name: string, commands: Command[]) {
        this.name = name;
        this.commands = commands;

        if (commands.length === 0) {
            console.warn('[BatchCommand] Created with empty command array');
        }
    }

    execute(): void {
        // Execute all commands in order
        this.commands.forEach((cmd) => cmd.execute());
    }

    undo(): void {
        // Undo all commands in reverse order
        [...this.commands].reverse().forEach((cmd) => cmd.undo());
    }

    /** Number of commands in batch */
    get length(): number {
        return this.commands.length;
    }
}
