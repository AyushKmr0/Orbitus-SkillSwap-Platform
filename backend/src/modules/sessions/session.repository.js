import Session from '../../models/Session.js';
import User from '../../models/User.js';
import Badge from '../../models/Badge.js';
import Certificate from '../../models/Certificate.js';
import Leaderboard from '../../models/Leaderboard.js';

export class SessionRepository {
  async create(data) {
    return Session.create(data);
  }

  async findById(id) {
    return Session.findById(id);
  }

  async findByIdWithParticipants(id) {
    return Session.findById(id).populate('mentor learner skill');
  }

  async findUserSessionHistory(userId) {
    return Session.find({
      $or: [{ mentor: userId }, { learner: userId }]
    })
      .populate('mentor learner', 'name username profileImage bio experienceLevel points')
      .populate('skill', 'name category')
      .populate('meetingLinkAddedBy', 'name username')
      .sort({ startTime: -1 })
      .lean();
  }

  async findUserById(id) {
    return User.findById(id);
  }

  async countCompletedMentorSessions(mentorId) {
    return Session.countDocuments({
      mentor: mentorId,
      status: 'Completed',
      pointsAwarded: true
    });
  }

  async unlockBadge(userId, name) {
    return Badge.findOneAndUpdate(
      { user: userId, name },
      { $setOnInsert: { user: userId, name, unlockedAt: new Date() } },
      { upsert: true }
    );
  }

  async findCertificate(recipientId, skillId) {
    return Certificate.findOne({
      recipient: recipientId,
      skill: skillId
    });
  }

  async createCertificate(data) {
    return Certificate.create(data);
  }

  async updateLeaderboardPoints(userId, points) {
    return Leaderboard.findOneAndUpdate(
      { user: userId },
      { $inc: { points } },
      { upsert: true }
    );
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
