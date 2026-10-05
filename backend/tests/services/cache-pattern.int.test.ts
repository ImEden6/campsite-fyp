// Clearing cache keys by pattern (real Redis)
//
// Pattern clears used Redis KEYS, which scans everything in one blocking call. They now use SCAN.

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { CacheService } from '@/services/cache.service';

describe('CacheService pattern operations (real Redis)', () => {
  const cache = new CacheService();
  const redis = (cache as unknown as { redis: { keys: (...a: unknown[]) => unknown; scanStream: (...a: unknown[]) => unknown } }).redis;
  const prefix = `scan-test-${Date.now()}`;

  const fill = async (resource: string, count: number) => {
    await Promise.all(Array.from({ length: count }, (_, i) => cache.set(`${prefix}:${resource}:${i}`, i, 60)));
  };
  const remaining = (resource: string) => cache.keys(`${prefix}:${resource}:*`);

  beforeAll(async () => {
    await cache.connect();
    await vi.waitFor(() => expect(cache.isReady()).toBe(true));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cache.flushPattern(`${prefix}:*`);
  });

  afterAll(async () => {
    await cache.disconnect();
  });

  it('finds every key that matches, however many there are', async () => {
    await fill('many', 2500); // far more than one SCAN step (200)

    expect(await remaining('many')).toHaveLength(2500);
  });

  it('removes only the keys that match the pattern', async () => {
    await fill('availability', 30);
    await fill('other', 30);

    await cache.flushPattern(`${prefix}:availability:*`);

    expect(await remaining('availability')).toHaveLength(0);
    expect(await remaining('other')).toHaveLength(30);
  });

  it('clears thousands of keys in one call', async () => {
    await fill('bulk', 2500); // more than one delete batch (500)

    await cache.flushPattern(`${prefix}:bulk:*`);

    expect(await remaining('bulk')).toHaveLength(0);
  });

  it('never uses the blocking KEYS command', async () => {
    await fill('safe', 10);
    const keysSpy = vi.spyOn(redis, 'keys');
    const scanSpy = vi.spyOn(redis, 'scanStream');

    await cache.flushPattern(`${prefix}:safe:*`);

    expect(keysSpy).not.toHaveBeenCalled();
    expect(scanSpy).toHaveBeenCalledWith(expect.objectContaining({ match: `${prefix}:safe:*` }));
  });

  it('returns nothing, and does nothing, when no key matches', async () => {
    expect(await cache.keys(`${prefix}:none:*`)).toEqual([]);
    await expect(cache.flushPattern(`${prefix}:none:*`)).resolves.toBeUndefined();
  });

  it('does not report the same key twice', async () => {
    await fill('dupes', 600);

    const keys = await cache.keys(`${prefix}:dupes:*`);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
