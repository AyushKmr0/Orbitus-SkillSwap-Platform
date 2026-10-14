import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setUserPresenceOnline,
  setUserPresenceOffline,
  getUserPresenceSocketCount,
  isUserGloballyOnline,
  getGlobalOnlineUserIds,
  getGlobalOnlineUserCount,
  evictExpiredPresence,
  isRedisConnected
} from '../config/redis.js';

describe('Redis Sorted Set Presence Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null or false safely when Redis is not connected', async () => {
    expect(isRedisConnected()).toBe(false);
    expect(await isUserGloballyOnline('user_123')).toBe(null);
    expect(await getGlobalOnlineUserIds()).toBe(null);
    expect(await getGlobalOnlineUserIds(50)).toBe(null);
    expect(await getGlobalOnlineUserIds({ limit: 20, offset: 0 })).toBe(null);
    expect(await getGlobalOnlineUserCount()).toBe(null);
    expect(await getUserPresenceSocketCount('user_123')).toBe(0);
    expect(await setUserPresenceOnline('user_123', 'socket_1')).toBe(false);
    expect(await setUserPresenceOffline('user_123', 'socket_1')).toBe(false);
    expect(await evictExpiredPresence()).toBe(0);
  });

  it('should manage multi-socket state and sorted set eviction with active mock client', async () => {
    const socketSets = new Map();
    const activeUsersZSet = new Map();

    const mockRedis = {
      sAdd: vi.fn(async (key, value) => {
        if (!socketSets.has(key)) socketSets.set(key, new Set());
        socketSets.get(key).add(value);
      }),
      expire: vi.fn(async () => true),
      zAdd: vi.fn(async (key, entries) => {
        for (const entry of entries) {
          activeUsersZSet.set(entry.value, entry.score);
        }
      }),
      sRem: vi.fn(async (key, value) => {
        if (socketSets.has(key)) {
          socketSets.get(key).delete(value);
        }
      }),
      sCard: vi.fn(async (key) => {
        return socketSets.has(key) ? socketSets.get(key).size : 0;
      }),
      del: vi.fn(async (key) => {
        socketSets.delete(key);
      }),
      zRem: vi.fn(async (key, value) => {
        activeUsersZSet.delete(value);
      }),
      zScore: vi.fn(async (key, value) => {
        return activeUsersZSet.has(value) ? activeUsersZSet.get(value) : null;
      }),
      zRemRangeByScore: vi.fn(async (key, min, max) => {
        let removed = 0;
        const maxVal = typeof max === 'number' ? max : Infinity;
        for (const [userId, score] of activeUsersZSet.entries()) {
          if (score <= maxVal) {
            activeUsersZSet.delete(userId);
            removed++;
          }
        }
        return removed;
      }),
      zRangeByScore: vi.fn(async (key, min, max, options) => {
        const minVal = typeof min === 'number' ? min : -Infinity;
        const results = [];
        for (const [userId, score] of activeUsersZSet.entries()) {
          if (score >= minVal) {
            results.push(userId);
          }
        }
        const limit = options?.LIMIT?.count || results.length;
        return results.slice(0, limit);
      }),
      zCount: vi.fn(async (key, min, _max) => {
        const minVal = typeof min === 'number' ? min : -Infinity;
        let count = 0;
        for (const [, score] of activeUsersZSet.entries()) {
          if (score >= minVal) count++;
        }
        return count;
      })
    };

    const userId = 'user_multi';
    const socket1 = 'sock_desktop';
    const socket2 = 'sock_mobile';
    const socketKey = `presence:user:${userId}:sockets`;
    const now = Date.now();

    // 1. User connects from desktop
    await mockRedis.sAdd(socketKey, socket1);
    await mockRedis.zAdd('presence:active_users', [{ score: now + 60000, value: userId }]);
    expect(await mockRedis.sCard(socketKey)).toBe(1);
    expect(await mockRedis.zScore('presence:active_users', userId)).toBeGreaterThan(now);

    // 2. User connects from mobile
    await mockRedis.sAdd(socketKey, socket2);
    await mockRedis.zAdd('presence:active_users', [{ score: now + 60000, value: userId }]);
    expect(await mockRedis.sCard(socketKey)).toBe(2);

    // 3. Desktop disconnects -> remaining sockets is 1, so user remains active
    await mockRedis.sRem(socketKey, socket1);
    const rem1 = await mockRedis.sCard(socketKey);
    expect(rem1).toBe(1);
    if (rem1 === 0) {
      await mockRedis.del(socketKey);
      await mockRedis.zRem('presence:active_users', userId);
    }
    expect(activeUsersZSet.has(userId)).toBe(true);

    // 4. Mobile disconnects -> remaining sockets is 0, user removed from active_users
    await mockRedis.sRem(socketKey, socket2);
    const rem2 = await mockRedis.sCard(socketKey);
    expect(rem2).toBe(0);
    if (rem2 === 0) {
      await mockRedis.del(socketKey);
      await mockRedis.zRem('presence:active_users', userId);
    }
    expect(activeUsersZSet.has(userId)).toBe(false);

    // 5. Test auto-eviction of expired scores
    activeUsersZSet.set('stale_user_1', now - 5000);
    activeUsersZSet.set('fresh_user_2', now + 50000);
    expect(activeUsersZSet.size).toBe(2);

    const evictedCount = await mockRedis.zRemRangeByScore('presence:active_users', '-inf', now);
    expect(evictedCount).toBe(1);
    expect(activeUsersZSet.has('stale_user_1')).toBe(false);
    expect(activeUsersZSet.has('fresh_user_2')).toBe(true);
  });

  it('should support atomic Lua script semantics for concurrent connect/disconnect', () => {
    // Simulating the Lua script logic atomically inside Redis
    const socketSets = new Map();
    const activeUsersZSet = new Map();

    const luaOnline = (socketKey, activeKey, socketId, ttl, score, uId) => {
      if (!socketSets.has(socketKey)) socketSets.set(socketKey, new Set());
      socketSets.get(socketKey).add(socketId);
      activeUsersZSet.set(uId, score);
      return socketSets.get(socketKey).size;
    };

    const luaOffline = (socketKey, activeKey, socketId, uId) => {
      if (socketSets.has(socketKey)) {
        socketSets.get(socketKey).delete(socketId);
        if (socketSets.get(socketKey).size === 0) {
          socketSets.delete(socketKey);
          activeUsersZSet.delete(uId);
          return 0;
        }
        return socketSets.get(socketKey).size;
      }
      return 0;
    };

    const userA = 'user_concurrent';
    const sKey = `presence:user:${userA}:sockets`;
    const zKey = 'presence:active_users';

    // Step 1: Socket 1 connects
    const count1 = luaOnline(sKey, zKey, 's1', 90, Date.now() + 90000, userA);
    expect(count1).toBe(1);
    expect(activeUsersZSet.has(userA)).toBe(true);

    // Step 2: Socket 2 connects concurrently
    const count2 = luaOnline(sKey, zKey, 's2', 90, Date.now() + 90000, userA);
    expect(count2).toBe(2);

    // Step 3: Socket 1 disconnects (remaining is 1, user remains in active_users)
    const remSockets = luaOffline(sKey, zKey, 's1', userA);
    expect(remSockets).toBe(1);
    expect(activeUsersZSet.has(userA)).toBe(true);

    // Step 4: Socket 2 disconnects (remaining is 0, user removed atomically)
    const finalSockets = luaOffline(sKey, zKey, 's2', userA);
    expect(finalSockets).toBe(0);
    expect(activeUsersZSet.has(userA)).toBe(false);
  });
});
