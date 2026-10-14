import { delCache, clearCachePattern, isRedisConnected } from '../config/redis.js';

/**
 * Service for managing domain cache invalidation in response to state-mutating DB writes.
 * All invalidations are designed to be fault-tolerant: Redis outages will never cause DB operations to fail.
 */

export const invalidateUserDashboard = async (userId) => {
  if (!userId || !isRedisConnected()) return false;
  try {
    const key = `dashboard:user:${userId}`;
    return await delCache(key);
  } catch (err) {
    console.warn('[CACHE INVALIDATION WARNING] User dashboard cache del failed:', err.message);
    return false;
  }
};

export const invalidateLeaderboard = async () => {
  if (!isRedisConnected()) return false;
  try {
    const canonicalKeys = [
      'dashboard:leaderboard:weekly',
      'dashboard:leaderboard:monthly',
      'dashboard:leaderboard:all-time',
      'leaderboard:weekly',
      'leaderboard:monthly',
      'leaderboard:all-time'
    ];
    await Promise.allSettled(canonicalKeys.map((k) => delCache(k)));
    await clearCachePattern('dashboard:leaderboard:*');
    return true;
  } catch (err) {
    console.warn('[CACHE INVALIDATION WARNING] Leaderboard cache clear failed:', err.message);
    return false;
  }
};

export const invalidateAdminStats = async () => {
  if (!isRedisConnected()) return false;
  try {
    await Promise.allSettled([
      delCache('dashboard:admin:stats'),
      delCache('dashboard:stats:overview')
    ]);
    return true;
  } catch (err) {
    console.warn('[CACHE INVALIDATION WARNING] Admin stats cache del failed:', err.message);
    return false;
  }
};

export const invalidateUserAndLeaderboard = async (userId) => {
  if (!userId) return false;
  await Promise.allSettled([
    invalidateUserDashboard(userId),
    invalidateLeaderboard()
  ]);
  return true;
};
