// Graceful shutdown
//
// Runs a list of named cleanup steps in order when the process is asked to stop. A failing step
// is logged and the rest still run; the whole thing is capped so a stuck step cannot hang a
// deploy; and calling it twice (e.g. a second Ctrl+C) does nothing extra.

import logger from '@/utils/logger';

export interface ShutdownStep {
  name: string;
  run: () => void | Promise<void>;
}

export interface ShutdownOptions {
  steps: ShutdownStep[];
  /** Force the exit if cleanup takes longer than this. */
  timeoutMs?: number;
  exit?: (code: number) => void;
}

export function createShutdown({ steps, timeoutMs = 10_000, exit = (code) => process.exit(code) }: ShutdownOptions) {
  let inProgress: Promise<void> | null = null;

  return function shutdown(reason: string, exitCode = 0): Promise<void> {
    if (inProgress) {
      logger.info(`Shutdown already in progress (ignoring ${reason})`);
      return inProgress;
    }

    logger.info(`Shutting down: ${reason}`);

    const forceExit = setTimeout(() => {
      logger.error(`Shutdown did not finish within ${timeoutMs}ms, forcing exit`);
      exit(1);
    }, timeoutMs);
    forceExit.unref();

    inProgress = (async () => {
      let failed = false;

      for (const step of steps) {
        try {
          await step.run();
          logger.info(`Shutdown step done: ${step.name}`);
        } catch (error) {
          failed = true;
          logger.error(`Shutdown step failed: ${step.name}`, error);
        }
      }

      clearTimeout(forceExit);
      exit(failed && exitCode === 0 ? 1 : exitCode);
    })();

    return inProgress;
  };
}
