import { AppError } from '../../shared/errors/app-error.js';
import { dashboardRepository } from './dashboard.repository.js';
import { getCache, setCache } from '../../infrastructure/redis/client.js';
import {
  invalidateAdminStats,
  invalidateUserAndLeaderboard,
  invalidateUserDashboard,
  invalidateLeaderboard
} from '../../services/cacheService.js';
import { activityService } from '../../services/activityService.js';
import UserActivity from '../../models/UserActivity.js';

export const BADGE_RULES = [
  {
    name: 'Beginner Mentor',
    description: 'Complete your first eligible teaching session.',
    target: 1,
    metric: 'completedMentorSessions'
  },
  {
    name: 'Skilled Mentor',
    description: 'Complete 3 eligible teaching sessions.',
    target: 3,
    metric: 'completedMentorSessions'
  },
  {
    name: 'Master Mentor',
    description: 'Complete 10 eligible teaching sessions.',
    target: 10,
    metric: 'completedMentorSessions'
  },
  {
    name: 'Top Contributor',
    description: 'Reach 300 points and publish 5 daily posts.',
    target: 5,
    metric: 'posts'
  }
];

export const buildBadgeProgress = (unlockedBadges, metrics) => {
  const unlockedByName = new Map(unlockedBadges.map((badge) => [badge.name, badge]));

  return BADGE_RULES.map((rule) => {
    const badge = unlockedByName.get(rule.name);
    const current =
      rule.name === 'Top Contributor'
        ? Math.min(
            rule.target,
            metrics.points >= 300 ? metrics.posts : Math.floor((metrics.points / 300) * rule.target)
          )
        : metrics[rule.metric];

    return {
      ...rule,
      current: Math.min(rule.target, current || 0),
      progress: Math.min(100, Math.round(((current || 0) / rule.target) * 100)),
      unlocked: Boolean(badge),
      unlockedAt: badge?.unlockedAt || null
    };
  });
};

export class DashboardService {
  constructor(repo = dashboardRepository) {
    this.repo = repo;
  }

  async getUserDashboardStats(userId) {
    const cacheKey = `dashboard:user:${userId}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const [user, sessions, userPostCount, certificates, roadmaps, reviews, unlockedBadges] =
      await Promise.all([
        this.repo.findUserById(userId),
        this.repo.findUserSessions(userId),
        this.repo.countUserPosts(userId),
        this.repo.findUserCertificates(userId, 20),
        this.repo.findUserRoadmaps(userId, 10),
        this.repo.findUserReviews(userId, 20),
        this.repo.findUserBadges(userId)
      ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const completedSessions = sessions.filter((s) => s.status === 'Completed');
    const completedMentorSessions = completedSessions.filter(
      (s) => s.mentor.toString() === userId.toString()
    );
    const pendingSessions = sessions.filter((s) => s.status === 'Pending');
    const acceptedSessions = sessions.filter((s) => s.status === 'Accepted');

    const learningMinutes = completedSessions.reduce((total, session) => {
      if (session.actualDurationMinutes) {
        return total + session.actualDurationMinutes;
      }
      const duration = Math.max(0, new Date(session.endTime) - new Date(session.startTime));
      return total + Math.round(duration / 60000);
    }, 0);
    const learningHours = Number((learningMinutes / 60).toFixed(1));

    const badgeProgress = buildBadgeProgress(unlockedBadges, {
      completedMentorSessions: completedMentorSessions.length,
      posts: userPostCount,
      points: user.points || 0
    });


    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const chartLabels = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      chartLabels.push(monthNames[d.getMonth()]);
    }

    const mentorSessionsData = [0, 0, 0, 0, 0, 0];
    const learnerSessionsData = [0, 0, 0, 0, 0, 0];

    completedSessions.forEach((session) => {
      const sessionMonth = new Date(session.startTime).getMonth();
      const monthIndexIndex = chartLabels.indexOf(monthNames[sessionMonth]);
      const hours = session.actualDurationMinutes
        ? session.actualDurationMinutes / 60
        : Math.max(0, (new Date(session.endTime) - new Date(session.startTime)) / 3600000);
      if (monthIndexIndex !== -1) {
        if (session.mentor.toString() === userId.toString()) {
          mentorSessionsData[monthIndexIndex] += Number(hours.toFixed(1));
        } else {
          learnerSessionsData[monthIndexIndex] += Number(hours.toFixed(1));
        }
      }
    });

    const userTimezone = user.timezone || 'Asia/Kolkata';
    const activityMap = await activityService.getActivityHeatmap(userId, threeYearsAgo, userTimezone);

    const userPoints = user.points || 0;
    const followersCount = user.followers?.length ?? user.followersCount ?? 0;
    const followingCount = user.following?.length ?? user.followingCount ?? 0;

    const stats = {
      points: userPoints,
      completedSessions: completedSessions.length,
      learningHours,
      certificatesEarned: certificates.length,
      activeRoadmaps: roadmaps.length,
      badgesUnlocked: unlockedBadges.length,
      followersCount,
      followingCount,
      totalExchanges: completedSessions.length,
      completedMentorSessions: completedMentorSessions.length,
      completedLearnerSessions: completedSessions.length - completedMentorSessions.length,
      pendingSessions: pendingSessions.length,
      acceptedSessions: acceptedSessions.length,
      postsCount: userPostCount
    };

    const metrics = {
      ...stats,
      certificatesCount: certificates.length,
      roadmapsCount: roadmaps.length,
      reviewsCount: reviews.length
    };

    const chart = {
      labels: chartLabels,
      mentorSessions: mentorSessionsData,
      learnerSessions: learnerSessionsData
    };

    const charts = {
      labels: chartLabels,
      mentorData: mentorSessionsData,
      learnerData: learnerSessionsData
    };

    const payload = {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        coverImage: user.coverImage || '',
        points: userPoints,
        skillsTeach: user.skillsTeach,
        skillsLearn: user.skillsLearn,
        followersCount,
        followingCount
      },
      stats,
      metrics,
      chart,
      charts: {
        ...charts,
        activityMap
      },
      activityHeatmap: activityMap,
      activityMap,
      timezone: userTimezone,
      badges: unlockedBadges,
      badgeProgress,
      certificates,
      recentCertificates: certificates,
      roadmaps,
      recentRoadmaps: roadmaps,
      reviews,
      recentReviews: reviews
    };

    await setCache(cacheKey, payload, 120);
    return { data: payload, cached: false };
  }

  async getAdminDashboardStats() {
    const cacheKey = 'dashboard:admin:stats';
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }

    const {
      totalUsers,
      totalSkills,
      totalSessions,
      totalReviews,
      totalRoadmaps,
      activeUsers,
      completedCount,
      pendingCount,
      acceptedCount,
      adminCount,
      categoryBreakdown,
      leaders
    } = await this.repo.getAdminCounts();

    const otherCount = totalSessions - (completedCount + pendingCount + acceptedCount);
    const standardUserCount = totalUsers - adminCount;

    const categoryLabels = categoryBreakdown.map((item) => item._id || 'Uncategorized');
    const categoryValues = categoryBreakdown.map((item) => item.count);

    const payload = {
      stats: {
        totalUsers,
        activeUsers,
        totalSkills,
        totalSessions,
        totalReviews,
        totalRoadmaps,
        standardUserCount,
        adminCount
      },
      charts: {
        sessionsBreakdown: {
          labels: ['Completed', 'Pending', 'Upcoming', 'Rescheduled/Cancelled'],
          data: [completedCount, pendingCount, acceptedCount, otherCount]
        },
        skillsBreakdown: {
          labels: categoryLabels,
          data: categoryValues
        }
      },
      leaderboard: leaders
    };

    await setCache(cacheKey, payload, 180);
    return { data: payload, cached: false };
  }

  async getLeaderboard(rawTimeframe = 'all-time') {
    const timeframe = ['weekly', 'monthly', 'all-time'].includes(rawTimeframe)
      ? rawTimeframe
      : 'all-time';

    const cacheKey = `dashboard:leaderboard:${timeframe}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }

    let leaders = [];

    if (timeframe === 'all-time') {
      leaders = await this.repo.getLeaderboardUsers(50);
    } else {
      const days = timeframe === 'weekly' ? 7 : 30;
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const activityPeriodPoints = new Map();
      try {
        const aggregated = await UserActivity.aggregate([
          { $match: { createdAt: { $gte: sinceDate } } },
          { $group: { _id: '$user', total: { $sum: '$pointsAwarded' } } }
        ]);
        if (Array.isArray(aggregated)) {
          aggregated.forEach((item) => {
            if (item._id) {
              activityPeriodPoints.set(item._id.toString(), item.total);
            }
          });
        }
      } catch (err) {
        console.warn('[LEADERBOARD AGGREGATION WARN]:', err.message);
      }

      const [recentSessions, recentPosts, topUsers] =
        await this.repo.getRecentSessionsAndPosts(sinceDate);

      const sessionCounts = new Map();
      const postCounts = new Map();

      recentSessions.forEach((s) => {
        if (s.mentor) {
          const id = s.mentor.toString();
          sessionCounts.set(id, (sessionCounts.get(id) || 0) + 1);
        }
        if (s.learner) {
          const id = s.learner.toString();
          sessionCounts.set(id, (sessionCounts.get(id) || 0) + 1);
        }
      });

      recentPosts.forEach((p) => {
        if (p.author) {
          const id = p.author.toString();
          postCounts.set(id, (postCounts.get(id) || 0) + 1);
        }
      });

      leaders = topUsers.map((user) => {
        const uId = user._id.toString();
        let periodPoints = activityPeriodPoints.get(uId);
        if (periodPoints === undefined) {
          const sCount = sessionCounts.get(uId) || 0;
          const pCount = postCounts.get(uId) || 0;
          periodPoints = sCount * 50 + pCount * 5;
        }

        return {
          ...user,
          points: periodPoints,
          allTimePoints: user.points || 0
        };
      });

      leaders.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if ((b.allTimePoints || 0) !== (a.allTimePoints || 0)) {
          return (b.allTimePoints || 0) - (a.allTimePoints || 0);
        }
        return String(a._id).localeCompare(String(b._id));
      });
    }

    const formattedLeaders = leaders.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      experienceLevel: user.experienceLevel,
      points: user.points || 0,
      allTimePoints: user.allTimePoints || user.points || 0
    }));

    const payload = { leaderboard: formattedLeaders, timeframe };
    await setCache(cacheKey, payload, 300);
    return { data: payload, cached: false };
  }

  async getAdminUsers({ page = 1, limit = 20, search = '', role = '' } = {}) {
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const query = {};
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { username: { $regex: s, $options: 'i' } }
      ];
    }
    if (role && role.trim()) {
      query.role = { $regex: new RegExp(`^${role.trim()}$`, 'i') };
    }

    const [users, total] = await this.repo.findAdminUsers(query, {
      skip: (parsedPage - 1) * parsedLimit,
      limit: parsedLimit
    });

    return {
      users,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async updateAdminUserRole(userId, role) {
    if (!['User', 'Admin'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await this.repo.updateUserRole(userId, role);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await Promise.allSettled([
      invalidateAdminStats(),
      invalidateUserDashboard(userId)
    ]);

    return user;
  }

  async deleteAdminUser(adminUserId, targetUserId) {
    if (targetUserId === adminUserId.toString()) {
      throw new AppError('Super admin cannot delete themselves', 400);
    }

    const user = await this.repo.deleteUser(targetUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await Promise.allSettled([
      invalidateAdminStats(),
      invalidateUserAndLeaderboard(targetUserId)
    ]);

    return user;
  }

  async getAdminGroups({ page = 1, limit = 20 } = {}) {
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [groups, total] = await this.repo.findAdminGroups({
      skip: (parsedPage - 1) * parsedLimit,
      limit: parsedLimit
    });

    return {
      groups,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async deleteAdminGroup(groupId) {
    const group = await this.repo.deleteGroup(groupId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    await invalidateAdminStats();
    return group;
  }

  async getAdminPosts({ page = 1, limit = 20 } = {}) {
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [posts, total] = await this.repo.findAdminPosts({
      skip: (parsedPage - 1) * parsedLimit,
      limit: parsedLimit
    });

    return {
      posts,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async deleteAdminPost(postId) {
    const post = await this.repo.deletePost(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    await Promise.allSettled([
      invalidateAdminStats(),
      invalidateLeaderboard()
    ]);

    return post;
  }

  async broadcastGlobalNotification(title, content) {
    if (!title || !content) {
      throw new AppError('Notification title and content are required', 400);
    }

    const allUsers = await this.repo.getAllUserIds();
    const notifications = allUsers.map((u) => ({
      recipient: u._id,
      type: 'system',
      title: `📢 ${title}`,
      content,
      link: '/dashboard'
    }));

    await this.repo.insertNotifications(notifications);
    return { recipientCount: notifications.length };
  }
}

export const dashboardService = new DashboardService();
