import { describe, it, expect } from 'vitest';
import { DashboardService, buildBadgeProgress, BADGE_RULES } from '../modules/dashboard/dashboard.service.js';
import {
  leaderboardQuerySchema,
  adminPaginationQuerySchema,
  updateAdminUserRoleSchema,
  broadcastNotificationSchema
} from '../modules/dashboard/dashboard.schema.js';

describe('Dashboard Domain & Schemas', () => {
  it('validates leaderboard and pagination query schemas', () => {
    expect(leaderboardQuerySchema.safeParse({ query: { timeframe: 'weekly' } }).success).toBe(true);
    expect(leaderboardQuerySchema.safeParse({ query: { timeframe: 'monthly' } }).success).toBe(true);
    expect(leaderboardQuerySchema.safeParse({ query: { timeframe: 'all-time' } }).success).toBe(true);
    expect(leaderboardQuerySchema.safeParse({ query: { timeframe: 'yearly' } }).success).toBe(false);
    expect(adminPaginationQuerySchema.safeParse({ query: { page: '1', limit: '20' } }).success).toBe(true);
  });

  it('validates admin role update schema', () => {
    const valid = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'Admin' }
    };
    expect(updateAdminUserRoleSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'SuperUser' }
    };
    expect(updateAdminUserRoleSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates broadcast notification schema', () => {
    const valid = {
      body: { title: 'System Maintenance', content: 'Scheduled for midnight.' }
    };
    expect(broadcastNotificationSchema.safeParse(valid).success).toBe(true);

    const empty = { body: { title: '', content: '' } };
    expect(broadcastNotificationSchema.safeParse(empty).success).toBe(false);
  });

  it('calculates badge progress properly', () => {
    const unlockedBadges = [{ name: 'Beginner Mentor', unlockedAt: new Date() }];
    const metrics = { completedMentorSessions: 2, posts: 3, points: 150 };

    const progress = buildBadgeProgress(unlockedBadges, metrics);
    expect(progress).toHaveLength(BADGE_RULES.length);

    const beginner = progress.find((p) => p.name === 'Beginner Mentor');
    expect(beginner.unlocked).toBe(true);
    expect(beginner.progress).toBe(100);

    const skilled = progress.find((p) => p.name === 'Skilled Mentor');
    expect(skilled.unlocked).toBe(false);
    expect(skilled.current).toBe(2);
    expect(skilled.progress).toBe(67);
  });

  it('prevents self-deletion in admin delete user', async () => {
    const service = new DashboardService({});
    await expect(
      service.deleteAdminUser('adminId1', 'adminId1')
    ).rejects.toThrow('Super admin cannot delete themselves');
  });
});
