import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../modules/dashboard/dashboard.service.js';
import UserActivity from '../models/UserActivity.js';
import * as redisClient from '../infrastructure/redis/client.js';

describe('Leaderboard Timeframe True Aggregation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(redisClient, 'getCache').mockResolvedValue(null);
    vi.spyOn(redisClient, 'setCache').mockResolvedValue(true);
  });

  it('aggregates period-specific points from UserActivity instead of lifetime points for weekly timeframe', async () => {
    const user1Id = '65f123456789abcdef000001';
    const user2Id = '65f123456789abcdef000002';

    // Mock UserActivity.aggregate returning weekly activity points
    vi.spyOn(UserActivity, 'aggregate').mockResolvedValue([
      { _id: user1Id, total: 85 }, // user1 earned 85 pts this week
      { _id: user2Id, total: 30 }  // user2 earned 30 pts this week
    ]);

    // Mock repo calls for topUsers and recent events
    vi.spyOn(dashboardService.repo, 'getRecentSessionsAndPosts').mockResolvedValue([
      [], // recentSessions
      [], // recentPosts
      [   // topUsers with lifetime points (User 2 has more lifetime points, but User 1 has more weekly points)
        { _id: user2Id, name: 'User Two', username: 'user2', points: 500 },
        { _id: user1Id, name: 'User One', username: 'user1', points: 150 }
      ]
    ]);

    const result = await dashboardService.getLeaderboard('weekly');
    expect(result.data).toBeDefined();
    expect(result.data.timeframe).toBe('weekly');

    const leaders = result.data.leaderboard;
    expect(leaders.length).toBe(2);

    // User 1 should be rank 1 with 85 period points (despite having fewer lifetime points)
    expect(leaders[0]._id).toBe(user1Id);
    expect(leaders[0].rank).toBe(1);
    expect(leaders[0].points).toBe(85);
    expect(leaders[0].allTimePoints).toBe(150);

    // User 2 should be rank 2 with 30 period points
    expect(leaders[1]._id).toBe(user2Id);
    expect(leaders[1].rank).toBe(2);
    expect(leaders[1].points).toBe(30);
    expect(leaders[1].allTimePoints).toBe(500);
  });

  it('aggregates period-specific points for monthly timeframe', async () => {
    const user1Id = '65f123456789abcdef000001';

    vi.spyOn(UserActivity, 'aggregate').mockResolvedValue([
      { _id: user1Id, total: 240 }
    ]);

    vi.spyOn(dashboardService.repo, 'getRecentSessionsAndPosts').mockResolvedValue([
      [],
      [],
      [{ _id: user1Id, name: 'User One', username: 'user1', points: 240 }]
    ]);

    const result = await dashboardService.getLeaderboard('monthly');
    expect(result.data.timeframe).toBe('monthly');
    expect(result.data.leaderboard[0].points).toBe(240);
  });
});
