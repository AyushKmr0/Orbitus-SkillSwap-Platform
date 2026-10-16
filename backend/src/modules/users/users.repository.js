import mongoose from 'mongoose';
import User from '../../models/User.js';
import Follow from '../../models/Follow.js';
import Notification from '../../models/Notification.js';
import Session from '../../models/Session.js';
import Post from '../../models/Post.js';
import Badge from '../../models/Badge.js';
import Message from '../../models/Message.js';
import Review from '../../models/Review.js';
import Roadmap from '../../models/Roadmap.js';
import ChatPreference from '../../models/ChatPreference.js';
import Certificate from '../../models/Certificate.js';
import Leaderboard from '../../models/Leaderboard.js';

export class UsersRepository {
  async findUserByIdWithSkills(id) {
    return User.findById(id).populate('skillsTeach.skill skillsLearn.skill');
  }

  async findUserById(id) {
    return User.findById(id);
  }

  async findUserByUsernameOrId(identifier) {
    let user;
    if (mongoose.isValidObjectId(identifier)) {
      user = await User.findById(identifier)
        .select('-password -refreshToken -otp -dailyLoginTracker')
        .populate('skillsTeach.skill skillsLearn.skill');
    }
    if (!user) {
      user = await User.findOne({ username: identifier })
        .select('-password -refreshToken -otp -dailyLoginTracker')
        .populate('skillsTeach.skill skillsLearn.skill');
    }
    return user;
  }

  async findPublicProfileData(userId) {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const [sessions, userPostCount, badges, userPosts] = await Promise.all([
      Session.find({ $or: [{ mentor: userId }, { learner: userId }] }),
      Post.countDocuments({ author: userId }),
      Badge.find({ user: userId }).sort({ unlockedAt: -1 }),
      Post.find({ author: userId, createdAt: { $gte: threeYearsAgo } }).select('createdAt')
    ]);

    return { sessions, userPostCount, badges, userPosts, oneYearAgo: threeYearsAgo };
  }

  async checkIsFollowing(followerId, followingId) {
    return Follow.exists({ follower: followerId, following: followingId });
  }

  async searchUsers(query, currentUserId, limit = 20) {
    return User.find({
      _id: { $ne: currentUserId },
      ...query
    })
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .populate('skillsTeach.skill skillsLearn.skill')
      .limit(limit);
  }

  async findSuggestedUsers(filter, { skip = 0, limit = 20 } = {}) {
    return Promise.all([
      User.find(filter)
        .select('-password -refreshToken -otp -dailyLoginTracker')
        .populate('skillsTeach.skill skillsLearn.skill')
        .sort({ points: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);
  }

  async followUser(followerId, followingId) {
    await Promise.all([
      Follow.create({ follower: followerId, following: followingId }),
      User.updateOne(
        { _id: followerId },
        { $addToSet: { following: followingId }, $inc: { followingCount: 1 } }
      ),
      User.updateOne(
        { _id: followingId },
        { $addToSet: { followers: followerId }, $inc: { followersCount: 1 } }
      )
    ]);
  }

  async unfollowUser(followerId, followingId) {
    await Promise.all([
      Follow.deleteOne({ follower: followerId, following: followingId }),
      User.updateOne(
        { _id: followerId },
        { $pull: { following: followingId }, $inc: { followingCount: -1 } }
      ),
      User.updateOne(
        { _id: followingId },
        { $pull: { followers: followerId }, $inc: { followersCount: -1 } }
      )
    ]);
  }

  async createNotification(data) {
    return Notification.create(data);
  }

  async findNotificationById(id) {
    return Notification.findById(id).populate('sender', 'name profileImage username').lean();
  }

  async updateUserFollowCounts(userId) {
    const user = await User.findById(userId).select('followers following');
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          followersCount: (user?.followers || []).length,
          followingCount: (user?.following || []).length
        }
      }
    );
  }

  async findFollowers(userId) {
    return User.findById(userId)
      .select('followers')
      .populate('followers', 'name username profileImage experienceLevel followers');
  }

  async findFollowing(userId) {
    return User.findById(userId)
      .select('following')
      .populate('following', 'name username profileImage experienceLevel followers');
  }

  async deleteFullAccountData(userId) {
    await Promise.all([
      Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      Post.deleteMany({ author: userId }),
      Post.updateMany({}, { $pull: { likes: userId, comments: { author: userId } } }),
      Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }),
      Review.deleteMany({ $or: [{ reviewer: userId }, { reviewee: userId }] }),
      Session.deleteMany({ $or: [{ learner: userId }, { mentor: userId }] }),
      Roadmap.deleteMany({ user: userId }),
      ChatPreference.deleteMany({ $or: [{ owner: userId }, { partner: userId }] }),
      Certificate.deleteMany({ recipient: userId }),
      Leaderboard.deleteMany({ user: userId }),
      User.updateMany({}, { $pull: { followers: userId, following: userId } })
    ]);

    await Post.updateMany({}, [
      { $set: { likesCount: { $size: '$likes' }, commentsCount: { $size: '$comments' } } }
    ]);
    await User.updateMany({}, [
      { $set: { followersCount: { $size: '$followers' }, followingCount: { $size: '$following' } } }
    ]);

    await User.deleteOne({ _id: userId });
  }

  async updateUserResume(userId, update) {
    return User.findByIdAndUpdate(userId, update, { new: true })
      .select('-password -refreshToken -otp')
      .populate('skillsTeach.skill skillsLearn.skill');
  }
}

export const usersRepository = new UsersRepository();
