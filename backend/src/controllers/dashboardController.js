import User from '../models/User.js';
import Session from '../models/Session.js';
import Skill from '../models/Skill.js';
import Badge from '../models/Badge.js';
import Roadmap from '../models/Roadmap.js';
import Review from '../models/Review.js';
import Post from '../models/Post.js';
import Certificate from '../models/Certificate.js';

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
  const unlockedByName = new Map(unlockedBadges.map(badge => [badge.name, badge]));

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

// @desc    Get dashboard statistics for current logged in user
// @route   GET /api/dashboard/user
// @access  Private
export const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Core Profile Details & Points
    const user = await User.findById(userId).populate('skillsTeach.skill skillsLearn.skill');
    
    // 2. Booking stats
    const sessions = await Session.find({
      $or: [{ mentor: userId }, { learner: userId }]
    });

    const completedSessions = sessions.filter(s => s.status === 'Completed');
    const completedMentorSessions = completedSessions.filter(s => s.mentor.toString() === userId.toString());
    const pendingSessions = sessions.filter(s => s.status === 'Pending');
    const acceptedSessions = sessions.filter(s => s.status === 'Accepted');

    const learningMinutes = completedSessions.reduce((total, session) => {
      if (session.actualDurationMinutes) {
        return total + session.actualDurationMinutes;
      }

      const duration = Math.max(0, new Date(session.endTime) - new Date(session.startTime));
      return total + Math.round(duration / 60000);
    }, 0);
    const learningHours = Number((learningMinutes / 60).toFixed(1));

    const userPostCount = await Post.countDocuments({ author: userId });

    // 3. Badges unlocked. Self-heal from current achievements so the locker never feels stuck.
    const unlockableBadgeNames = BADGE_RULES
      .filter((rule) => {
        if (rule.name === 'Top Contributor') return user.points >= 300 && userPostCount >= 5;
        return completedMentorSessions.length >= rule.target;
      })
      .map(rule => rule.name);

    await Promise.all(unlockableBadgeNames.map(name => Badge.findOneAndUpdate(
      { user: userId, name },
      { $setOnInsert: { user: userId, name, unlockedAt: new Date() } },
      { upsert: true, new: true }
    )));

    const badges = await Badge.find({ user: userId }).sort({ unlockedAt: -1 });
    const badgeProgress = buildBadgeProgress(badges, {
      completedMentorSessions: completedMentorSessions.length,
      posts: userPostCount,
      points: user.points
    });

    const certificates = await Certificate.find({ recipient: userId })
      .populate('skill', 'name category')
      .sort({ issueDate: -1 });

    // 4. Roadmaps active
    const roadmaps = await Roadmap.find({ user: userId });

    // 5. Reviews received (if user acts as a mentor)
    const reviews = await Review.find({ reviewee: userId }).populate('reviewer', 'name profileImage');
    const averageRating = reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    // 6. Formulate Chart Data (Sessions over the last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const chartLabels = [];
    const mentorSessionsData = Array(6).fill(0);
    const learnerSessionsData = Array(6).fill(0);

    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      chartLabels.push(monthNames[targetMonth]);
    }

    completedSessions.forEach(session => {
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

    res.status(200).json({
      success: true,
      stats: {
        points: user.points,
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
        learnerData: learnerSessionsData
      }
    });
  } catch (error) {
    console.error('User Dashboard Stats Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error compiling dashboard metrics' });
  }
};

// @desc    Get system administration dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
export const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Platform Totals
    const totalUsers = await User.countDocuments({});
    const totalSkills = await Skill.countDocuments({});
    const totalSessions = await Session.countDocuments({});
    const totalReviews = await Review.countDocuments({});
    const totalRoadmaps = await Roadmap.countDocuments({});

    // Active users: Users with activity points > 50 or recently registered
    const activeUsers = await User.countDocuments({ points: { $gt: 50 } });

    // 2. Fetch all sessions by status
    const completedCount = await Session.countDocuments({ status: 'Completed' });
    const pendingCount = await Session.countDocuments({ status: 'Pending' });
    const acceptedCount = await Session.countDocuments({ status: 'Accepted' });
    const otherCount = totalSessions - (completedCount + pendingCount + acceptedCount);

    // 3. User distribution (Admin vs standard User)
    const adminCount = await User.countDocuments({ role: 'Admin' });
    const standardUserCount = totalUsers - adminCount;

    // 4. Skills Share Breakdown by Category
    const skills = await Skill.find({});
    const categoryShares = {};
    skills.forEach(s => {
      categoryShares[s.category] = (categoryShares[s.category] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryShares);
    const categoryValues = Object.values(categoryShares);

    // 5. High Points Leaderboard lists
    const leaders = await User.find({ role: 'User' })
      .sort({ points: -1 })
      .select('name email points profileImage')
      .limit(5);

    res.status(200).json({
      success: true,
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
    });
  } catch (error) {
    console.error('Admin Dashboard Stats Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error compiling administrator statistics' });
  }
};

// @desc    Get public platform leaderboard for authenticated users
// @route   GET /api/dashboard/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const leaders = await User.find({ role: 'User' })
      .sort({ points: -1, createdAt: 1 })
      .select('name email points profileImage experienceLevel')
      .limit(25);

    res.status(200).json({
      success: true,
      leaderboard: leaders
    });
  } catch (error) {
    console.error('Leaderboard Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error loading leaderboard' });
  }
};
