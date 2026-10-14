import Feedback from '../../models/Feedback.js';

export class FeedbackRepository {
  async create(data) {
    return Feedback.create(data);
  }

  async findByUserId(userId, limit = 30) {
    return Feedback.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findWithFilter(filter = {}) {
    return Feedback.find(filter)
      .populate('user', 'name username email profileImage role')
      .sort({ createdAt: -1 })
      .lean();
  }

  async countUnread() {
    return Feedback.countDocuments({ status: 'unread' });
  }

  async findById(id) {
    return Feedback.findById(id);
  }

  async deleteById(id) {
    return Feedback.findByIdAndDelete(id);
  }
}

export const feedbackRepository = new FeedbackRepository();
export default feedbackRepository;
