import User from '../../models/User.js';
import Session from '../../models/Session.js';
import Skill from '../../models/Skill.js';
import Badge from '../../models/Badge.js';
import Roadmap from '../../models/Roadmap.js';
import Review from '../../models/Review.js';
import Post from '../../models/Post.js';
import Certificate from '../../models/Certificate.js';
import Group from '../../models/Group.js';
import Notification from '../../models/Notification.js';

export class DashboardRepository {
  async findUserById(userId) {
    return User.findById(userId).populate('skillsTeach.skill skillsLearn.skill').lean();
  }

  async findUserSessions(userId) {
    return Session.find({ $or: [{ mentor: userId }, { learner: userId }] }).lean();
  }

  async countUserPosts(userId) {
    return Post.countDocuments({ author: userId });
  }

  async findUserCertificates(userId, limit = 20) {
    return Certificate.find({ recipient: userId })
      .populate('skill', 'name category')
      .sort({ issueDate: -1 })
      .limit(limit)
      .lean();
  }

  async findUserRoadmaps(userId, limit = 10) {
    return Roadmap.find({ user: userId }).limit(limit).lean();
  }

  async findUserReviews(userId, limit = 20) {
    return Review.find({ reviewee: userId })
      .populate('reviewer', 'name profileImage')
      .limit(limit)
      .lean();
  }

  async findUserPostsSince(userId, sinceDate) {
    return Post.find({ author: userId, createdAt: { $gte: sinceDate } })
      .select('createdAt')
      .lean();
  }

  async findUserBadges(userId) {
    return Badge.find({ user: userId }).lean();
  }

  async getAdminCounts() {
    const [
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
    ] = await Promise.all([
      User.countDocuments({}),
      Skill.countDocuments({}),
      Session.countDocuments({}),
      Review.countDocuments({}),
      Roadmap.countDocuments({}),
      User.countDocuments({ points: { $gt: 50 } }),
      Session.countDocuments({ status: 'Completed' }),
      Session.countDocuments({ status: 'Pending' }),
      Session.countDocuments({ status: 'Accepted' }),
      User.countDocuments({ role: 'Admin' }),
      Skill.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      User.find({ role: 'User' }).sort({ points: -1 }).select('name email points profileImage').limit(5).lean()
    ]);

    return {
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
    };
  }

  async getLeaderboardUsers(limit = 50) {
    return User.find({ role: 'User' })
      .select('name username email points profileImage experienceLevel createdAt')
      .sort({ points: -1 })
      .limit(limit)
      .lean();
  }

  async getRecentSessionsAndPosts(sinceDate) {
    return Promise.all([
      Session.find({ status: 'Completed', updatedAt: { $gte: sinceDate } }).select('mentor learner').lean(),
      Post.find({ createdAt: { $gte: sinceDate } }).select('author').lean(),
      User.find({ role: 'User' }).select('name username email points profileImage experienceLevel').sort({ points: -1 }).limit(50).lean()
    ]);
  }

  async findAdminUsers(query, { skip = 0, limit = 20 } = {}) {
    return Promise.all([
      User.find(query).select('name username email role points createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query)
    ]);
  }

  async updateUserRole(id, role) {
    return User.findByIdAndUpdate(id, { role }, { new: true }).select('name email role');
  }

  async deleteUser(id) {
    return User.findByIdAndDelete(id);
  }

  async findAdminGroups({ skip = 0, limit = 20 } = {}) {
    return Promise.all([
      Group.find({}).populate('creator', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Group.countDocuments({})
    ]);
  }

  async deleteGroup(id) {
    return Group.findByIdAndDelete(id);
  }

  async findAdminPosts({ skip = 0, limit = 20 } = {}) {
    return Promise.all([
      Post.find({}).populate('author', 'name email profileImage').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments({})
    ]);
  }

  async deletePost(id) {
    return Post.findByIdAndDelete(id);
  }

  async getAllUserIds() {
    return User.find({}).select('_id').lean();
  }

  async insertNotifications(notifications) {
    return Notification.insertMany(notifications);
  }
}

export const dashboardRepository = new DashboardRepository();
