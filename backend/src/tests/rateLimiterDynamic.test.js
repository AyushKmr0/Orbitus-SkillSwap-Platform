import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamicRateLimitStore } from '../middlewares/rateLimiter.js';

describe('Dynamic Rate Limiter Store Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize and increment hits in standalone memory store when Redis is offline', async () => {
    const store = new DynamicRateLimitStore({
      prefix: 'rl:test:',
      windowMs: 60 * 1000
    });
    store.init({ windowMs: 60 * 1000 });

    const key = '127.0.0.1';
    const hit1 = await store.increment(key);
    expect(hit1).toBeDefined();
    expect(hit1.totalHits).toBe(1);

    const hit2 = await store.increment(key);
    expect(hit2.totalHits).toBe(2);

    await store.resetKey(key);
    const hit3 = await store.increment(key);
    expect(hit3.totalHits).toBe(1);
  });

  it('should gracefully degrade to local memory store if active store throws an error', async () => {
    const store = new DynamicRateLimitStore({
      prefix: 'rl:test-degrade:',
      windowMs: 60 * 1000
    });
    store.init({ windowMs: 60 * 1000 });

    // Mock an active store that throws
    const faultyStore = {
      increment: vi.fn().mockRejectedValue(new Error('Redis connection dropped')),
      decrement: vi.fn().mockRejectedValue(new Error('Redis connection dropped')),
      resetKey: vi.fn().mockRejectedValue(new Error('Redis connection dropped'))
    };

    vi.spyOn(store, 'getActiveStore').mockReturnValue(faultyStore);

    const key = 'user_abc';
    // Even though active store throws, increment catches and falls back to memoryStore
    const result = await store.increment(key);
    expect(result).toBeDefined();
    expect(result.totalHits).toBe(1);
  });
});
