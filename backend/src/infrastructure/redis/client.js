import { createClient } from 'redis';

let redisClient = null;
let pubClient = null;
let subClient = null;
let isConnected = false;

export const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    const clientOptions = {
      url: redisUrl,
      socket: {
        connectTimeout: 2500,
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            return new Error('Redis connection attempts exceeded');
          }
          return 500;
        }
      }
    };

    redisClient = createClient(clientOptions);
    pubClient = createClient(clientOptions);
    subClient = createClient(clientOptions);

    redisClient.on('error', (err) => {
      if (isConnected) {
        console.warn('[REDIS WARNING]: Redis client error:', err.message);
      }
      isConnected = false;
    });

    pubClient.on('error', (err) => {
      if (isConnected) {
        console.warn('[REDIS WARNING]: Pub client error:', err.message);
      }
    });

    subClient.on('error', (err) => {
      if (isConnected) {
        console.warn('[REDIS WARNING]: Sub client error:', err.message);
      }
    });

    let timeoutTimer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutTimer = setTimeout(() => {
        reject(new Error('Redis connection attempt timed out after 3000ms'));
      }, 3000);
      if (timeoutTimer.unref) timeoutTimer.unref();
    });

    try {
      await Promise.race([
        Promise.all([
          redisClient.connect(),
          pubClient.connect(),
          subClient.connect()
        ]),
        timeoutPromise
      ]);
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    }

    isConnected = true;
    console.log('[REDIS SUCCESS]: Connected to Redis service successfully.');
    return { redisClient, pubClient, subClient, isConnected: true };
  } catch (error) {
    console.warn(`[REDIS NOTICE]: Redis connection unavailable (${error.message}). Operating in standalone in-memory degraded mode.`);

    // Clean up any partially initialized clients to avoid dangling event loops
    const clients = [redisClient, pubClient, subClient].filter(Boolean);
    await Promise.allSettled(clients.map((c) => c.disconnect().catch(() => {})));
    redisClient = null;
    pubClient = null;
    subClient = null;
    isConnected = false;

    // Fail-fast only if Redis is explicitly marked as required (REDIS_REQUIRED === 'true')
    const redisRequired = process.env.REDIS_REQUIRED === 'true';
    if (redisRequired) {
      throw new Error(`[CRITICAL] Redis is strictly required in this environment (REDIS_REQUIRED=true) but connection failed: ${error.message}`);
    }

    return { redisClient: null, pubClient: null, subClient: null, isConnected: false };
  }
};

export const closeRedis = async () => {
  isConnected = false;
  const clients = [redisClient, pubClient, subClient].filter(Boolean);
  await Promise.allSettled(clients.map((c) => c.quit().catch(() => c.disconnect().catch(() => {}))));
  redisClient = null;
  pubClient = null;
  subClient = null;
};

export const getRedisClient = () => (isConnected ? redisClient : null);
export const getPubClient = () => (isConnected ? pubClient : null);
export const getSubClient = () => (isConnected ? subClient : null);
export const isRedisConnected = () => isConnected;

// Caching Utilities with Automatic Graceful Degradation
export const setCache = async (key, value, ttlSeconds = 300) => {
  if (!isConnected || !redisClient) return false;
  try {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(key, ttlSeconds, data);
    return true;
  } catch (err) {
    console.warn('[REDIS CACHE SET ERROR]:', err.message);
    return false;
  }
};

export const getCache = async (key) => {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (err) {
    console.warn('[REDIS CACHE GET ERROR]:', err.message);
    return null;
  }
};

export const delCache = async (key) => {
  if (!isConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.warn('[REDIS CACHE DEL ERROR]:', err.message);
    return false;
  }
};

export const clearCachePattern = async (pattern) => {
  if (!isConnected || !redisClient) return false;
  try {
    const keysToDelete = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(key);
    }
    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }
    return true;
  } catch (err) {
    console.warn('[REDIS CLEAR PATTERN ERROR]:', err.message);
    return false;
  }
};

// Redis-backed presence management with TTL fallback and Sorted Set eviction
const DEFAULT_PRESENCE_TTL_SECONDS = 90;
const MAX_EVICTION_BATCH_SIZE = 500;

/**
 * Bounded eviction of expired presence tombstones.
 * Note: Redis Sorted Sets do NOT have automatic member TTL eviction.
 * Expired entries are removed in bounded batches of at most `maxBatch` to avoid blocking Redis.
 *
 * @param {number} [maxBatch=500] Maximum members to remove in one execution
 * @returns {Promise<number>} Number of evicted records
 */
export const evictExpiredPresence = async (maxBatch = MAX_EVICTION_BATCH_SIZE) => {
  if (!isConnected || !redisClient) return 0;
  try {
    const now = Date.now();
    if (typeof redisClient.eval === 'function') {
      const script = `
        local expired = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, tonumber(ARGV[2]))
        if #expired > 0 then
          redis.call('ZREM', KEYS[1], unpack(expired))
        end
        return #expired
      `;
      const res = await redisClient.eval(script, {
        keys: ['presence:active_users'],
        arguments: [String(now), String(maxBatch)]
      });
      return Number(res) || 0;
    }
    return await redisClient.zRemRangeByScore('presence:active_users', '-inf', now);
  } catch (err) {
    console.warn('[REDIS PRESENCE EVICTION ERROR]:', err.message);
    return 0;
  }
};

/**
 * Atomically marks a socket online for a given user.
 * Executes atomically via Lua script to prevent state desync across simultaneous connects.
 */
export const setUserPresenceOnline = async (userId, socketId, ttlSeconds = DEFAULT_PRESENCE_TTL_SECONDS) => {
  if (!isConnected || !redisClient || !userId) return false;
  try {
    const uId = userId.toString();
    const socketKey = `presence:user:${uId}:sockets`;
    const expiryScore = Date.now() + (ttlSeconds * 1000);

    if (typeof redisClient.eval === 'function') {
      const script = `
        redis.call('SADD', KEYS[1], ARGV[1])
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
        redis.call('ZADD', KEYS[2], tonumber(ARGV[3]), ARGV[4])
        return 1
      `;
      await redisClient.eval(script, {
        keys: [socketKey, 'presence:active_users'],
        arguments: [socketId, String(ttlSeconds), String(expiryScore), uId]
      });
      return true;
    }

    await redisClient.sAdd(socketKey, socketId);
    await redisClient.expire(socketKey, ttlSeconds);
    await redisClient.zAdd('presence:active_users', [{ score: expiryScore, value: uId }]);
    return true;
  } catch (err) {
    console.warn('[REDIS PRESENCE ONLINE ERROR]:', err.message);
    return false;
  }
};

/**
 * Atomically marks a socket offline for a user.
 * Removes user from active set only when all sockets for this user have disconnected.
 */
export const setUserPresenceOffline = async (userId, socketId) => {
  if (!isConnected || !redisClient || !userId) return false;
  try {
    const uId = userId.toString();
    const socketKey = `presence:user:${uId}:sockets`;

    if (typeof redisClient.eval === 'function') {
      const script = `
        redis.call('SREM', KEYS[1], ARGV[1])
        local remaining = redis.call('SCARD', KEYS[1])
        if remaining == 0 then
          redis.call('DEL', KEYS[1])
          redis.call('ZREM', KEYS[2], ARGV[2])
        end
        return remaining
      `;
      await redisClient.eval(script, {
        keys: [socketKey, 'presence:active_users'],
        arguments: [socketId, uId]
      });
      return true;
    }

    await redisClient.sRem(socketKey, socketId);
    const remaining = await redisClient.sCard(socketKey);
    if (remaining === 0) {
      await redisClient.del(socketKey);
      await redisClient.zRem('presence:active_users', uId);
    }
    return true;
  } catch (err) {
    console.warn('[REDIS PRESENCE OFFLINE ERROR]:', err.message);
    return false;
  }
};

/**
 * Refreshes user presence heartbeat atomically via Lua.
 */
export const refreshUserPresence = async (userId, ttlSeconds = DEFAULT_PRESENCE_TTL_SECONDS) => {
  if (!isConnected || !redisClient || !userId) return false;
  try {
    const uId = userId.toString();
    const socketKey = `presence:user:${uId}:sockets`;
    const expiryScore = Date.now() + (ttlSeconds * 1000);

    if (typeof redisClient.eval === 'function') {
      const script = `
        if redis.call('EXISTS', KEYS[1]) == 1 then
          redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
          redis.call('ZADD', KEYS[2], tonumber(ARGV[2]), ARGV[3])
          return 1
        else
          return 0
        end
      `;
      const res = await redisClient.eval(script, {
        keys: [socketKey, 'presence:active_users'],
        arguments: [String(ttlSeconds), String(expiryScore), uId]
      });
      return Number(res) === 1;
    }

    const exists = await redisClient.exists(socketKey);
    if (exists) {
      await redisClient.expire(socketKey, ttlSeconds);
      await redisClient.zAdd('presence:active_users', [{ score: expiryScore, value: uId }]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[REDIS PRESENCE REFRESH ERROR]:', err.message);
    return false;
  }
};

export const getUserPresenceSocketCount = async (userId) => {
  if (!isConnected || !redisClient || !userId) return 0;
  try {
    const uId = userId.toString();
    const socketKey = `presence:user:${uId}:sockets`;
    return await redisClient.sCard(socketKey);
  } catch (err) {
    console.warn('[REDIS PRESENCE COUNT ERROR]:', err.message);
    return 0;
  }
};

export const isUserGloballyOnline = async (userId) => {
  if (!isConnected || !redisClient || !userId) return null;
  try {
    const score = await redisClient.zScore('presence:active_users', userId.toString());
    return score !== null && Number(score) > Date.now();
  } catch (err) {
    console.warn('[REDIS PRESENCE CHECK ERROR]:', err.message);
    return null;
  }
};

/**
 * API Contract: Retrieves a bounded sample of globally online user IDs.
 * Returns at most `limit` IDs (default 100). Callers should treat this as a bounded sample,
 * not an exhaustive cluster-wide census.
 *
 * @param {number|Object} [optionsOrLimit=100] Maximum count or { limit, offset }
 * @returns {Promise<string[] | null>} Array of active user IDs, or null if Redis is offline
 */
export const getGlobalOnlineUserIds = async (optionsOrLimit = 100) => {
  if (!isConnected || !redisClient) return null;
  const limit = typeof optionsOrLimit === 'number' ? optionsOrLimit : (optionsOrLimit?.limit || 100);
  const offset = typeof optionsOrLimit === 'object' ? (optionsOrLimit?.offset || 0) : 0;
  try {
    const now = Date.now();
    const ids = await redisClient.zRangeByScore('presence:active_users', now, '+inf', {
      LIMIT: { offset, count: limit }
    });
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    console.warn('[REDIS PRESENCE GET ALL ERROR]:', err.message);
    return null;
  }
};

export const getGlobalOnlineUserCount = async () => {
  if (!isConnected || !redisClient) return null;
  try {
    const now = Date.now();
    return await redisClient.zCount('presence:active_users', now, '+inf');
  } catch (err) {
    console.warn('[REDIS PRESENCE COUNT ALL ERROR]:', err.message);
    return null;
  }
};
