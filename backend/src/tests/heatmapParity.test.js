import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from '../modules/users/users.service.js';
import { dashboardService } from '../modules/dashboard/dashboard.service.js';
import { activityService } from '../services/activityService.js';
import * as redisClient from '../infrastructure/redis/client.js';

describe('Profile & Dashboard Heatmap Parity & Daily Login Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(redisClient, 'getCache').mockResolvedValue(null);
    vi.spyOn(redisClient, 'setCache').mockResolvedValue(true);
  });

  it('guarantees public profile and user dashboard return identical activityMap for the same user', async () => {
    const userId = '65f123456789abcdef000001';
    const mockUser = {
      _id: userId,
      name: 'Dev Explorer',
      username: 'devexplorer',
      role: 'User',
      points: 85,
      followers: [],
      following: [],
      skillsTeach: [],
      skillsLearn: [],
      coverImage: '',
      profileImage: ''
    };

    const mockHeatmap = {
      '2026-10-10': 1, // login
      '2026-10-11': 2, // login + post
      '2026-10-12': 3  // login + session + resource
    };

    // Spy on activityService.getActivityHeatmap to return mockHeatmap
    vi.spyOn(activityService, 'getActivityHeatmap').mockResolvedValue(mockHeatmap);

    // Mock usersService repo dependencies
    vi.spyOn(usersService.repo, 'findUserByUsernameOrId').mockResolvedValue(mockUser);
    vi.spyOn(usersService.repo, 'checkIsFollowing').mockResolvedValue(false);
    vi.spyOn(usersService.repo, 'findPublicProfileData').mockResolvedValue({
      sessions: [],
      userPostCount: 1,
      badges: [],
      oneYearAgo: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    });

    // Mock dashboardService repo dependencies
    vi.spyOn(dashboardService.repo, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(dashboardService.repo, 'findUserSessions').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'countUserPosts').mockResolvedValue(1);
    vi.spyOn(dashboardService.repo, 'findUserCertificates').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserRoadmaps').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserReviews').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserBadges').mockResolvedValue([]);

    // 1. Fetch public profile
    const profileResponse = await usersService.getPublicUserProfile(userId, userId);
    expect(profileResponse.activityMap).toBeDefined();
    expect(profileResponse.activityMap).toEqual(mockHeatmap);

    // 2. Fetch dashboard
    const { data: dashboardResponse } = await dashboardService.getUserDashboardStats(userId);
    expect(dashboardResponse.activityMap).toBeDefined();
    expect(dashboardResponse.activityMap).toEqual(mockHeatmap);

    // 3. Exact parity verification
    expect(profileResponse.activityMap).toEqual(dashboardResponse.activityMap);
    expect(profileResponse.activityMap['2026-10-10']).toBe(1);
    expect(profileResponse.activityMap['2026-10-11']).toBe(2);
    expect(profileResponse.activityMap['2026-10-12']).toBe(3);
  });

  it('includes daily login events on public profile activity heatmap without double-counting', async () => {
    const userId = '65f123456789abcdef000002';
    const mockUser = {
      _id: userId,
      name: 'Active Member',
      username: 'activemember',
      role: 'User',
      points: 10,
      followers: [],
      following: [],
      skillsTeach: [],
      skillsLearn: []
    };

    // User only logged in once today (no posts or sessions)
    const expectedHeatmap = {
      '2026-10-12': 1
    };

    vi.spyOn(activityService, 'getActivityHeatmap').mockResolvedValue(expectedHeatmap);
    vi.spyOn(usersService.repo, 'findUserByUsernameOrId').mockResolvedValue(mockUser);
    vi.spyOn(usersService.repo, 'checkIsFollowing').mockResolvedValue(false);
    vi.spyOn(usersService.repo, 'findPublicProfileData').mockResolvedValue({
      sessions: [],
      userPostCount: 0,
      badges: [],
      oneYearAgo: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    });

    const profileResponse = await usersService.getPublicUserProfile(userId, userId);

    expect(profileResponse.activityMap).toBeDefined();
    expect(profileResponse.activityMap['2026-10-12']).toBe(1);
  });

  it('ensures admin users also have activityMap, stats, and badges returned on public profile', async () => {
    const adminId = '65f123456789abcdef000003';
    const mockAdmin = {
      _id: adminId,
      name: 'Admin User',
      username: 'adminuser',
      role: 'Admin',
      points: 250,
      followers: [],
      following: [],
      skillsTeach: [],
      skillsLearn: []
    };

    const mockHeatmap = { '2026-10-14': 4 };
    vi.spyOn(activityService, 'getActivityHeatmap').mockResolvedValue(mockHeatmap);
    vi.spyOn(usersService.repo, 'findUserByUsernameOrId').mockResolvedValue(mockAdmin);
    vi.spyOn(usersService.repo, 'checkIsFollowing').mockResolvedValue(false);
    vi.spyOn(usersService.repo, 'findPublicProfileData').mockResolvedValue({
      sessions: [{ status: 'Completed' }],
      userPostCount: 5,
      badges: [{ name: 'Top Mentor' }],
      oneYearAgo: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
    });

    const profileResponse = await usersService.getPublicUserProfile(adminId, adminId);

    expect(profileResponse.activityMap).toBeDefined();
    expect(profileResponse.activityMap['2026-10-14']).toBe(4);
    expect(profileResponse.stats).toBeDefined();
    expect(profileResponse.stats.completedSessions).toBe(1);
    expect(profileResponse.stats.postsCount).toBe(5);
    expect(profileResponse.badges).toHaveLength(1);
  });

  it('invalidates user dashboard cache even on repeat logins within the same calendar day', async () => {
    const userId = '65f123456789abcdef000004';
    const UserActivity = (await import('../models/UserActivity.js')).default;
    const User = (await import('../models/User.js')).default;
    const cacheService = await import('../services/cacheService.js');
    const invalidateSpy = vi.spyOn(cacheService, 'invalidateUserDashboard').mockResolvedValue(true);

    const duplicateErr = new Error('E11000 duplicate key error collection: useractivities index: idempotencyKey_1 dup key');
    duplicateErr.code = 11000;
    vi.spyOn(UserActivity, 'create').mockRejectedValue(duplicateErr);

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: userId,
        points: 20,
        dailyLoginTracker: new Date('2026-10-14T08:00:00Z')
      })
    });

    const result = await activityService.recordDailyLogin({ userId, now: new Date('2026-10-14T10:00:00Z') });

    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('already_awarded_today');
    expect(invalidateSpy).toHaveBeenCalledWith(userId);
  });
});
