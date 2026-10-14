import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as redisConfig from '../config/redis.js';
import {
  invalidateUserDashboard,
  invalidateLeaderboard,
  invalidateAdminStats,
  invalidateUserAndLeaderboard
} from '../services/cacheService.js';

describe('Cache Invalidation Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call delCache with the exact user dashboard key when connected', async () => {
    vi.spyOn(redisConfig, 'isRedisConnected').mockReturnValue(true);
    const delSpy = vi.spyOn(redisConfig, 'delCache').mockResolvedValue(true);

    const result = await invalidateUserDashboard('user_123');

    expect(result).toBe(true);
    expect(delSpy).toHaveBeenCalledWith('dashboard:user:user_123');
  });

  it('should clear leaderboard pattern matching dashboard:leaderboard:*', async () => {
    vi.spyOn(redisConfig, 'isRedisConnected').mockReturnValue(true);
    const clearSpy = vi.spyOn(redisConfig, 'clearCachePattern').mockResolvedValue(true);

    const result = await invalidateLeaderboard();

    expect(result).toBe(true);
    expect(clearSpy).toHaveBeenCalledWith('dashboard:leaderboard:*');
  });

  it('should invalidate admin stats keys', async () => {
    vi.spyOn(redisConfig, 'isRedisConnected').mockReturnValue(true);
    const delSpy = vi.spyOn(redisConfig, 'delCache').mockResolvedValue(true);

    const result = await invalidateAdminStats();

    expect(result).toBe(true);
    expect(delSpy).toHaveBeenCalledWith('dashboard:admin:stats');
    expect(delSpy).toHaveBeenCalledWith('dashboard:stats:overview');
  });

  it('should gracefully degrade when Redis is disconnected without throwing', async () => {
    vi.spyOn(redisConfig, 'isRedisConnected').mockReturnValue(false);

    expect(await invalidateUserDashboard('user_123')).toBe(false);
    expect(await invalidateLeaderboard()).toBe(false);
    expect(await invalidateAdminStats()).toBe(false);
    expect(await invalidateUserAndLeaderboard('user_123')).toBe(true);
  });
});
