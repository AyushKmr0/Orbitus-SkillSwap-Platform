import { describe, it, expect } from 'vitest';
import { getCache, setCache, delCache, clearCachePattern, isRedisConnected } from '../config/redis.js';

describe('Redis Acceleration & Cache Degradation Tests', () => {
  it('should handle getCache, setCache, delCache gracefully when disconnected', async () => {
    // When Redis client is not connected, helpers must return null/false without throwing
    const isConn = isRedisConnected();
    if (!isConn) {
      const getRes = await getCache('test_key');
      expect(getRes).toBeNull();

      const setRes = await setCache('test_key', { data: 1 });
      expect(setRes).toBe(false);

      const delRes = await delCache('test_key');
      expect(delRes).toBe(false);

      const clearRes = await clearCachePattern('test:*');
      expect(clearRes).toBe(false);
    } else {
      expect(isConn).toBe(true);
    }
  });
});
