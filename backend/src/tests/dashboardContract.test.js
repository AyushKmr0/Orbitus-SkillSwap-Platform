import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserDashboardStats } from '../modules/dashboard/dashboard.controller.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Post from '../models/Post.js';
import Certificate from '../models/Certificate.js';
import Roadmap from '../models/Roadmap.js';
import Review from '../models/Review.js';
import Badge from '../models/Badge.js';

describe('User Dashboard Response Contract Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a complete contract containing stats, metrics, charts, roadmaps, and certificates', async () => {
    const mockUserId = '65f123456789abcdef123456';
    const mockUser = {
      _id: mockUserId,
      name: 'Test Learner',
      username: 'testlearner',
      email: 'learner@example.com',
      role: 'User',
      points: 250,
      followersCount: 5,
      followingCount: 8,
      followers: ['id1', 'id2', 'id3', 'id4', 'id5'],
      following: ['id1', 'id2', 'id3', 'id4', 'id5', 'id6', 'id7', 'id8'],
      skillsTeach: [],
      skillsLearn: []
    };

    const mockSessions = [
      {
        _id: 's1',
        mentor: mockUserId,
        learner: 'other1',
        status: 'Completed',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        actualDurationMinutes: 60
      },
      {
        _id: 's2',
        mentor: 'other2',
        learner: mockUserId,
        status: 'Completed',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        actualDurationMinutes: 60
      }
    ];

    const mockCertificates = [
      { _id: 'cert1', uniqueId: 'CERT-100', issueDate: new Date() }
    ];

    const mockRoadmaps = [
      { _id: 'rm1', topic: 'React Mastery', progress: 50 }
    ];

    const mockReviews = [
      { _id: 'rev1', rating: 5, comment: 'Great exchange!' }
    ];

    const mockBadges = [
      { _id: 'b1', name: 'Beginner Mentor', unlockedAt: new Date() }
    ];

    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      })
    });

    vi.spyOn(Session, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockSessions)
    });

    vi.spyOn(Post, 'countDocuments').mockResolvedValue(4);
    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    vi.spyOn(Certificate, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockCertificates)
          })
        })
      })
    });

    vi.spyOn(Roadmap, 'find').mockReturnValue({
      limit: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockRoadmaps)
      })
    });

    vi.spyOn(Review, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockReviews)
        })
      })
    });

    vi.spyOn(Badge, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockBadges)
    });

    const req = {
      user: { _id: mockUserId }
    };

    let responseStatus = null;
    let responseBody = null;

    const res = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (body) => {
            responseBody = body;
            return body;
          }
        };
      }
    };

    await getUserDashboardStats(req, res);

    expect(responseStatus).toBe(200);
    expect(responseBody).toBeDefined();
    expect(responseBody.success).toBe(true);

    const payload = responseBody.data;
    expect(payload).toBeDefined();

    // 1. User details & Authoritative points
    expect(payload.user).toBeDefined();
    expect(payload.user.points).toBe(250);
    expect(payload.user.followersCount).toBe(5);
    expect(payload.user.followingCount).toBe(8);

    // 2. Stats object (expected by UserDashboard.jsx)
    expect(payload.stats).toBeDefined();
    expect(payload.stats.points).toBe(250);
    expect(payload.stats.completedSessions).toBe(2);
    expect(payload.stats.learningHours).toBe(2);
    expect(payload.stats.certificatesEarned).toBe(1);
    expect(payload.stats.activeRoadmaps).toBe(1);
    expect(payload.stats.badgesUnlocked).toBe(1);
    expect(payload.stats.followersCount).toBe(5);
    expect(payload.stats.followingCount).toBe(8);

    // 3. Metrics object (backwards-compatible alias)
    expect(payload.metrics).toBeDefined();
    expect(payload.metrics.points).toBe(250);
    expect(payload.metrics.totalExchanges).toBe(2);

    // 4. Charts objects (for UserDashboard Bar chart)
    expect(payload.charts).toBeDefined();
    expect(Array.isArray(payload.charts.labels)).toBe(true);
    expect(Array.isArray(payload.charts.mentorData)).toBe(true);
    expect(Array.isArray(payload.charts.learnerData)).toBe(true);

    // 5. Chart object (alias for single-chart consumers)
    expect(payload.chart).toBeDefined();
    expect(Array.isArray(payload.chart.labels)).toBe(true);
    expect(Array.isArray(payload.chart.mentorSessions)).toBe(true);
    expect(Array.isArray(payload.chart.learnerSessions)).toBe(true);

    // 6. Roadmaps & Certificates arrays (compatible with both roadmaps and recentRoadmaps)
    expect(Array.isArray(payload.roadmaps)).toBe(true);
    expect(Array.isArray(payload.recentRoadmaps)).toBe(true);
    expect(payload.roadmaps.length).toBe(1);

    expect(Array.isArray(payload.certificates)).toBe(true);
    expect(Array.isArray(payload.recentCertificates)).toBe(true);
    expect(payload.certificates.length).toBe(1);

    // 7. Badges and Badge Progress
    expect(Array.isArray(payload.badges)).toBe(true);
    expect(Array.isArray(payload.badgeProgress)).toBe(true);
  });

  it('should return consistent envelope and data structure on cache hit', async () => {
    const mockUserId = '65f123456789abcdef123456';
    const cachedPayload = {
      user: { _id: mockUserId, name: 'Cached User', points: 300, followersCount: 1, followingCount: 2 },
      stats: { points: 300, completedSessions: 5, learningHours: 10, certificatesEarned: 2, activeRoadmaps: 1, badgesUnlocked: 2, followersCount: 1, followingCount: 2, totalExchanges: 5 },
      metrics: { points: 300, totalExchanges: 5 },
      charts: { labels: ['Jan', 'Feb'], mentorData: [1, 2], learnerData: [2, 1] },
      chart: { labels: ['Jan', 'Feb'], mentorSessions: [1, 2], learnerSessions: [2, 1] },
      certificates: [],
      recentCertificates: [],
      roadmaps: [],
      recentRoadmaps: [],
      badges: [],
      badgeProgress: []
    };

    const redis = await import('../infrastructure/redis/client.js');
    vi.spyOn(redis, 'getCache').mockResolvedValue(cachedPayload);

    const req = { user: { _id: mockUserId } };
    let responseStatus = null;
    let responseBody = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (body) => {
            responseBody = body;
            return body;
          }
        };
      }
    };

    await getUserDashboardStats(req, res);

    expect(responseStatus).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toContain('cached');
    expect(responseBody.data.user.points).toBe(300);
    expect(responseBody.data.stats.learningHours).toBe(10);
  });

  it('should return safe zeroed statistics for a brand new user with no activity', async () => {
    const mockUserId = '65f999999999abcdef999999';
    const mockNewUser = {
      _id: mockUserId,
      name: 'Newbie',
      username: 'newbie',
      email: 'newbie@example.com',
      role: 'User',
      points: 0,
      skillsTeach: [],
      skillsLearn: []
    };

    const redis = await import('../infrastructure/redis/client.js');
    vi.spyOn(redis, 'getCache').mockResolvedValue(null);

    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockNewUser)
      })
    });
    vi.spyOn(Session, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([])
    });
    vi.spyOn(Post, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });
    vi.spyOn(Certificate, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([])
          })
        })
      })
    });
    vi.spyOn(Roadmap, 'find').mockReturnValue({
      limit: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });
    vi.spyOn(Review, 'find').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      })
    });
    vi.spyOn(Badge, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([])
    });

    const req = { user: { _id: mockUserId } };
    let responseBody = null;
    const res = {
      status: () => ({
        json: (body) => {
          responseBody = body;
          return body;
        }
      })
    };

    await getUserDashboardStats(req, res);

    expect(responseBody.success).toBe(true);
    expect(responseBody.data.stats.points).toBe(0);
    expect(responseBody.data.stats.completedSessions).toBe(0);
    expect(responseBody.data.stats.learningHours).toBe(0);
    expect(responseBody.data.stats.certificatesEarned).toBe(0);
    expect(responseBody.data.stats.activeRoadmaps).toBe(0);
    expect(responseBody.data.stats.badgesUnlocked).toBe(0);
    expect(Number.isNaN(responseBody.data.stats.learningHours)).toBe(false);
  });
});
