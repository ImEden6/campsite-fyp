// Graceful shutdown: order, failure handling, repeat signals and the safety timeout

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createShutdown, type ShutdownStep } from '@/shutdown';

describe('createShutdown', () => {
  const calls: string[] = [];
  const exit = vi.fn();

  const step = (name: string, run: () => void | Promise<void> = () => undefined): ShutdownStep => ({
    name,
    run: async () => {
      calls.push(`start:${name}`);
      await run();
      calls.push(`end:${name}`);
    },
  });

  beforeEach(() => {
    calls.length = 0;
    exit.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the steps in order, waiting for each, then exits cleanly', async () => {
    const shutdown = createShutdown({
      steps: [
        step('jobs'),
        step('server', () => new Promise((resolve) => setTimeout(resolve, 20))),
        step('database'),
      ],
      exit,
    });

    await shutdown('SIGTERM');

    expect(calls).toEqual(['start:jobs', 'end:jobs', 'start:server', 'end:server', 'start:database', 'end:database']);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('keeps going when a step fails, and then exits with an error code', async () => {
    const shutdown = createShutdown({
      steps: [
        step('server'),
        step('cache', () => {
          throw new Error('redis is gone');
        }),
        step('database'),
      ],
      exit,
    });

    await shutdown('SIGTERM');

    expect(calls).toContain('end:database'); // later steps still ran
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('keeps a non-zero exit code it was given', async () => {
    const shutdown = createShutdown({ steps: [step('server')], exit });

    await shutdown('uncaughtException', 1);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('does nothing extra when signalled twice', async () => {
    const shutdown = createShutdown({ steps: [step('server', () => new Promise((resolve) => setTimeout(resolve, 20)))], exit });

    const first = shutdown('SIGINT');
    const second = shutdown('SIGINT');
    await Promise.all([first, second]);

    expect(calls.filter((c) => c === 'start:server')).toHaveLength(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('forces an exit if a step hangs past the timeout', async () => {
    vi.useFakeTimers();
    const shutdown = createShutdown({ steps: [{ name: 'stuck', run: () => new Promise(() => undefined) }], timeoutMs: 5000, exit });

    void shutdown('SIGTERM');
    expect(exit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('does not force an exit when cleanup finishes in time', async () => {
    vi.useFakeTimers();
    const shutdown = createShutdown({ steps: [step('server')], timeoutMs: 5000, exit });

    await shutdown('SIGTERM');
    await vi.advanceTimersByTimeAsync(10_000);

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });
});
