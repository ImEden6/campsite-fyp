/**
 * BatchCommand
 * Groups multiple commands into a single undoable action.
 */

import type { Command } from './Command';

export class BatchCommand implements Command {
    readonly name: string;

    constructor(name: string, private commands: Command[]) {
        this.name = name;
    }

    execute(): void {
        this.commands.forEach((cmd) => cmd.execute());
    }

    undo(): void {
        // Undo in reverse order
        [...this.commands].reverse().forEach((cmd) => cmd.undo());
    }
}
