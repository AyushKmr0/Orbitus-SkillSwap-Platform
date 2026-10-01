import User from '../models/User.js';
import Session from '../models/Session.js';
import Skill from '../models/Skill.js';
import Badge from '../models/Badge.js';
import Roadmap from '../models/Roadmap.js';
import Review from '../models/Review.js';
import Post from '../models/Post.js';
import Certificate from '../models/Certificate.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const BADGE_RULES = [
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

const buildBadgeProgress = (unlockedBadges, metrics) => {
  const unlockedByName = new Map(unlockedBadges.map((badge) => [badge.name, badge]));

  return BADGE_RULES.map((rule) => {
    const badge = unlockedByName.get(rule.name);
    const current = rule.name === 'Top Contributor'
      ? Math.min(rule.target, metrics.points >= 300 ? metrics.posts : Math.floor((metrics.points / 300) * rule.target))
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

export const getUserDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [user, sessions, userPostCount, certificates, roadmaps, reviews, userPosts] = await Promise.all([
    User.findById(userId).populate('skillsTeach.skill skillsLearn.skill').lean(),
    Session.find({ $or: [{ mentor: userId }, { learner: userId }] }).lean(),
    Post.countDocuments({ author: userId }),
    Certificate.find({ recipient: userId }).populate('skill', 'name category').sort({ issueDate: -1 }).lean(),
    Roadmap.find({ user: userId }).lean(),
    Review.find({ reviewee: userId }).populate('reviewer', 'name profileImage').lean(),
    Post.find({ author: userId, createdAt: { $gte: oneYearAgo } }).select('createdAt').lean()
  ]);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const completedSessions = sessions.filter((s) => s.status === 'Completed');
  const completedMentorSessions = completedSessions.filter((s) => s.mentor.toString() === userId.toString());
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

  const unlockableBadgeNames = BADGE_RULES
    .filter((rule) => {
      if (rule.name === 'Top Contributor') return user.points >= 300 && userPostCount >= 5;
      return completedMentorSessions.length >= rule.target;
    })
    .map((rule) => rule.name);

  if (unlockableBadgeNames.length > 0) {
    await Promise.all(unlockableBadgeNames.map((name) => Badge.findOneAndUpdate(
      { user: userId, name },
      { $setOnInsert: { user: userId, name, unlockedAt: new Date() } },
      { upsert: true, new: true }
    )));
  }

  const badges = await Badge.find({ user: userId }).sort({ unlockedAt: -1 }).lean();
  const badgeProgress = buildBadgeProgress(badges, {
    completedMentorSessions: completedMentorSessions.length,
    posts: userPostCount,
    points: user.points
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();

  const chartLabels = [];
  const mentorSessionsData = Array(6).fill(0);
  const learnerSessionsData = Array(6).fill(0);

  for (let i = 5; i >= 0; i--) {
    const targetMonth = (currentMonth - i + 12) % 12;
    chartLabels.push(monthNames[targetMonth]);
  }

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

  // Build real per-day activity for GitHub heatmap (last 365 days)
  const activityMap = {};
  sessions.forEach((session) => {
    if (session.status === 'Completed' && session.startTime) {
      const d = new Date(session.startTime);
      if (d >= oneYearAgo) {
        const key = d.toISOString().split('T')[0];
        activityMap[key] = (activityMap[key] || 0) + 1;
      }
    }
  });

  userPosts.forEach((post) => {
    const key = new Date(post.createdAt).toISOString().split('T')[0];
    activityMap[key] = (activityMap[key] || 0) + 1;
  });

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        coverImage: user.coverImage || '',
        bio: user.bio || '',
        experienceLevel: user.experienceLevel,
        points: user.points,
        followersCount: user.followers?.length ?? user.followersCount ?? 0,
        followingCount: user.following?.length ?? user.followingCount ?? 0,
        skillsTeach: user.skillsTeach,
        skillsLearn: user.skillsLearn,
        interests: user.interests || []
      },
      stats: {
        points: user.points,
        followersCount: user.followers?.length ?? user.followersCount ?? 0,
        followingCount: user.following?.length ?? user.followingCount ?? 0,
        skillsTaught: user.skillsTeach.length,
        skillsLearned: user.skillsLearn.length,
        completedSessions: completedSessions.length,
        pendingSessions: pendingSessions.length,
        upcomingSessions: acceptedSessions.length,
        learningHours,
        averageRating,
        totalReviews: reviews.length,
        badgesCount: badges.length
      },
      badges,
      badgeProgress,
      certificates,
      roadmaps,
      reviews,
      charts: {
        labels: chartLabels,
        mentorData: mentorSessionsData,
        learnerData: learnerSessionsData,
        activityMap
      }
    }, 'User dashboard stats retrieved')
  );
});

export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({});
  const totalSkills = await Skill.countDocuments({});
  const totalSessions = await Session.countDocuments({});
  const totalReviews = await Review.countDocuments({});
  const totalRoadmaps = await Roadmap.countDocuments({});
  const activeUsers = await User.countDocuments({ points: { $gt: 50 } });

  const completedCount = await Session.countDocuments({ status: 'Completed' });
  const pendingCount = await Session.countDocuments({ status: 'Pending' });
  const acceptedCount = await Session.countDocuments({ status: 'Accepted' });
  const otherCount = totalSessions - (completedCount + pendingCount + acceptedCount);

  const adminCount = await User.countDocuments({ role: 'Admin' });
  const standardUserCount = totalUsers - adminCount;

  const skills = await Skill.find({});
  const categoryShares = {};
  skills.forEach((s) => {
    categoryShares[s.category] = (categoryShares[s.category] || 0) + 1;
  });

  const categoryLabels = Object.keys(categoryShares);
  const categoryValues = Object.values(categoryShares);

  const leaders = await User.find({ role: 'User' })
    .sort({ points: -1 })
    .select('name email points profileImage')
    .limit(5);

  return res.status(200).json(
    new ApiResponse(200, {
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
    }, 'Admin dashboard metrics retrieved')
  );
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const rawTimeframe = String(req.query.timeframe || 'all-time').toLowerCase();
  const timeframe = ['weekly', 'monthly', 'all-time'].includes(rawTimeframe) ? rawTimeframe : 'all-time';

  const users = await User.find({ role: 'User' })
    .select('name username email points profileImage experienceLevel createdAt');

  let processedUsers = [];

  if (timeframe === 'weekly') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = await Session.find({ status: 'Completed', updatedAt: { $gte: sevenDaysAgo } });
    const recentPosts = await Post.find({ createdAt: { $gte: sevenDaysAgo } });

    processedUsers = users.map((user) => {
      const uId = user._id.toString();
      const sessionCount = recentSessions.filter(
        (s) => s.mentor?.toString() === uId || s.learner?.toString() === uId
      ).length;
      const postCount = recentPosts.filter((p) => p.author?.toString() === uId).length;
      const weeklyPoints = (sessionCount * 50) + (postCount * 15) + Math.min(Math.round((user.points || 0) * 0.12), 60);

      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        experienceLevel: user.experienceLevel,
        points: weeklyPoints,
        allTimePoints: user.points || 0,
        createdAt: user.createdAt
      };
    });
  } else if (timeframe === 'monthly') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlySessions = await Session.find({ status: 'Completed', updatedAt: { $gte: thirtyDaysAgo } });
    const monthlyPosts = await Post.find({ createdAt: { $gte: thirtyDaysAgo } });

    processedUsers = users.map((user) => {
      const uId = user._id.toString();
      const sessionCount = monthlySessions.filter(
        (s) => s.mentor?.toString() === uId || s.learner?.toString() === uId
      ).length;
      const postCount = monthlyPosts.filter((p) => p.author?.toString() === uId).length;
      const monthlyPoints = (sessionCount * 50) + (postCount * 15) + Math.min(Math.round((user.points || 0) * 0.4), 180);

      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        experienceLevel: user.experienceLevel,
        points: monthlyPoints,
        allTimePoints: user.points || 0,
        createdAt: user.createdAt
      };
    });
  } else {
    processedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      experienceLevel: user.experienceLevel,
      points: user.points || 0,
      allTimePoints: user.points || 0,
      createdAt: user.createdAt
    }));
  }

  processedUsers.sort((a, b) => b.points - a.points || new Date(a.createdAt) - new Date(b.createdAt));

  const currentUserId = req.user?._id?.toString();
  const currentUserIndex = processedUsers.findIndex((u) => u._id.toString() === currentUserId);
  const currentUserRank = currentUserIndex !== -1 ? {
    rank: currentUserIndex + 1,
    points: processedUsers[currentUserIndex].points,
    user: {
      _id: processedUsers[currentUserIndex]._id,
      name: processedUsers[currentUserIndex].name,
      username: processedUsers[currentUserIndex].username,
      email: processedUsers[currentUserIndex].email,
      profileImage: processedUsers[currentUserIndex].profileImage,
      experienceLevel: processedUsers[currentUserIndex].experienceLevel
    },
    isInTopPodium: currentUserIndex < 3,
    isInTopList: currentUserIndex < 25
  } : null;

  const leaders = processedUsers.slice(0, 25);

  return res.status(200).json(
    new ApiResponse(200, {
      timeframe,
      totalRankedUsers: processedUsers.length,
      currentUserRank,
      leaderboard: leaders
    }, 'Leaderboard retrieved')
  );
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search && search.trim()) {
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { username: { $regex: safe, $options: 'i' } }
    ];
  }

  if (role && role !== 'All') {
    query.role = role;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const totalUsers = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password -refreshToken -otp')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      totalUsers,
      page: parseInt(page, 10),
      pages: Math.ceil(totalUsers / parseInt(limit, 10))
    }, 'Admin users retrieved')
  );
});

export const updateAdminUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['Admin', 'User'].includes(role)) {
    throw new ApiError(400, 'Invalid role specified');
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { user }, `User role updated to ${role}`)
  );
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  await Session.deleteMany({ $or: [{ mentor: id }, { learner: id }] });
  await Post.deleteMany({ author: id });

  return res.status(200).json(
    new ApiResponse(200, null, 'User account and associated records deleted')
  );
});

export const getAdminGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({})
    .populate('creator', 'name username email')
    .sort({ createdAt: -1 });

  const formatted = groups.map((g) => ({
    _id: g._id,
    name: g.name,
    privacy: g.privacy,
    category: g.category,
    creator: g.creator,
    membersCount: g.members?.length || 0,
    createdAt: g.createdAt,
    meetingLink: g.meetingLink
  }));

  return res.status(200).json(
    new ApiResponse(200, { groups: formatted }, 'Admin groups retrieved')
  );
});

export const deleteAdminGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Group.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, 'Group deleted successfully')
  );
});

export const getAdminPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'name username profileImage')
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json(
    new ApiResponse(200, { posts }, 'Admin posts retrieved')
  );
});

export const deleteAdminPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Post.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, 'Post removed by administrator')
  );
});

export const broadcastGlobalNotification = asyncHandler(async (req, res) => {
  const { title, content, link } = req.body;
  if (!content) {
    throw new ApiError(400, 'Notification content is required');
  }

  const users = await User.find({ isVerified: true }).select('_id');
  const senderId = req.user ? req.user._id : users[0]?._id;

  const notifications = users.map((u) => ({
    recipient: u._id,
    sender: senderId,
    type: 'BadgeUnlocked',
    content: title ? `[Announcement] ${title}: ${content}` : `[Announcement] ${content}`,
    link: link || '/feed'
  }));

  await Notification.insertMany(notifications);

  return res.status(200).json(
    new ApiResponse(200, null, `Broadcast message sent to ${users.length} users successfully!`)
  );
});
