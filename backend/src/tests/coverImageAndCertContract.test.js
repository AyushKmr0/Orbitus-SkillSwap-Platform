import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../modules/dashboard/dashboard.service.js';
import * as redisClient from '../infrastructure/redis/client.js';
import { activityService } from '../services/activityService.js';

describe('Cover Image & Certificate Contract Verification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(redisClient, 'getCache').mockResolvedValue(null);
    vi.spyOn(redisClient, 'setCache').mockResolvedValue(true);
    vi.spyOn(activityService, 'getActivityHeatmap').mockResolvedValue({});
  });

  it('guarantees user.coverImage is always serialized in getUserDashboardStats response', async () => {
    const mockUser = {
      _id: '65f123456789abcdef000001',
      name: 'Elena Rostova',
      username: 'elena',
      email: 'elena@example.com',
      role: 'User',
      points: 210,
      coverImage: 'https://res.cloudinary.com/orbitus/image/upload/v1/covers/elena_banner.jpg',
      profileImage: 'https://res.cloudinary.com/orbitus/image/upload/v1/avatars/elena.jpg',
      followers: [],
      following: [],
      skillsTeach: [],
      skillsLearn: []
    };

    vi.spyOn(dashboardService.repo, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(dashboardService.repo, 'findUserSessions').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'countUserPosts').mockResolvedValue(0);
    vi.spyOn(dashboardService.repo, 'findUserCertificates').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserRoadmaps').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserReviews').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserBadges').mockResolvedValue([]);

    const { data } = await dashboardService.getUserDashboardStats(mockUser._id);

    expect(data.user).toBeDefined();
    expect(data.user.coverImage).toBe('https://res.cloudinary.com/orbitus/image/upload/v1/covers/elena_banner.jpg');
    expect(data.user.profileImage).toBe('https://res.cloudinary.com/orbitus/image/upload/v1/avatars/elena.jpg');
    expect(data.certificates).toEqual([]);
    expect(data.stats.certificatesEarned).toBe(0);
  });

  it('defaults coverImage to empty string when user has none set', async () => {
    const mockUser = {
      _id: '65f123456789abcdef000002',
      name: 'New Member',
      username: 'newmember',
      email: 'new@example.com',
      role: 'User',
      points: 0,
      profileImage: '',
      followers: [],
      following: [],
      skillsTeach: [],
      skillsLearn: []
    };

    vi.spyOn(dashboardService.repo, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(dashboardService.repo, 'findUserSessions').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'countUserPosts').mockResolvedValue(0);
    vi.spyOn(dashboardService.repo, 'findUserCertificates').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserRoadmaps').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserReviews').mockResolvedValue([]);
    vi.spyOn(dashboardService.repo, 'findUserBadges').mockResolvedValue([]);

    const { data } = await dashboardService.getUserDashboardStats(mockUser._id);

    expect(data.user.coverImage).toBe('');
  });
});
