import User from '../../models/User.js';
import Leaderboard from '../../models/Leaderboard.js';
import Badge from '../../models/Badge.js';

export class AuthRepository {
  async findUserByEmail(email) {
    return User.findOne({ email }).select('+password +otpCode +otpExpiresAt +resetPasswordToken +resetPasswordExpires');
  }

  async findUserByEmailWithoutPassword(email) {
    return User.findOne({ email });
  }

  async findUserById(id) {
    return User.findById(id).select('+refreshToken');
  }

  async findUserByIdWithPassword(id) {
    return User.findById(id).select('+password');
  }

  async findUserByProvider(provider, providerId) {
    return User.findOne({
      $or: [
        { [`oauthProfiles.${provider}.id`]: providerId },
        { [`oauth.${provider}.id`]: providerId }
      ]
    });
  }

  async userExists(query) {
    return User.exists(query);
  }

  async createUser(data) {
    return User.create(data);
  }

  async deleteUnverifiedUser(userId) {
    await Promise.allSettled([
      Leaderboard.deleteOne({ user: userId }),
      User.deleteOne({ _id: userId, isVerified: false })
    ]);
  }

  async createLeaderboardEntry(userId, points = 100) {
    return Leaderboard.create({ user: userId, points });
  }

  async unlockEarlyAdopterBadge(userId) {
    return Badge.create({
      user: userId,
      name: 'Early Adopter',
      description: 'Joined the platform during the early community launch.',
      icon: 'sparkles',
      category: 'Community',
      unlockedAt: new Date()
    });
  }

  async findUserByResetToken(token) {
    return User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
  }
}

export const authRepository = new AuthRepository();
