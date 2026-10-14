import feedbackRepository from './feedback.repository.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import { AppError } from '../../shared/errors/app-error.js';
import { emitNotificationToUser } from '../../socket/socketHandler.js';

export class FeedbackService {
  constructor(repo = feedbackRepository) {
    this.repo = repo;
  }

  async submitFeedback({ userId, userName, category, rating, subject, message }) {
    if (!message || !message.trim()) {
      throw new AppError(400, 'Please provide a feedback message.');
    }

    const feedback = await this.repo.create({
      user: userId,
      category: category || 'Platform Feedback',
      rating: Number(rating) || 5,
      subject: subject?.trim() || '',
      message: message.trim()
    });

    // Notify Admins about new user feedback asynchronously
    try {
      const adminUsers = await User.find({ role: { $in: ['admin', 'Admin'] } }).select('_id');
      const adminNotifications = adminUsers.map((adm) => ({
        recipient: adm._id,
        sender: userId,
        type: 'FeedbackSubmitted',
        content: `${userName || 'A user'} submitted ${category || 'general'} feedback${subject ? `: ${subject}` : '.'}`,
        link: '/admin?tab=feedbacks'
      }));

      if (adminNotifications.length > 0) {
        const savedNotifications = await Notification.insertMany(adminNotifications);
        savedNotifications.forEach((notification) => {
          emitNotificationToUser(notification.recipient, notification);
        });
      }
    } catch (notifErr) {
      console.error('Failed to create admin notification for feedback:', notifErr.message);
    }

    return feedback;
  }

  async getMyFeedbacks(userId) {
    return this.repo.findByUserId(userId);
  }

  async getAdminFeedbacks({ status, category }) {
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }

    const [feedbacks, unreadCount] = await Promise.all([
      this.repo.findWithFilter(filter),
      this.repo.countUnread()
    ]);

    return { feedbacks, unreadCount };
  }

  async updateFeedbackStatus(id, { status, adminNotes, adminId }) {
    const feedback = await this.repo.findById(id);
    if (!feedback) {
      throw new AppError(404, 'Feedback entry not found.');
    }

    const previousResponse = feedback.adminNotes || '';
    const nextResponse = adminNotes === undefined ? undefined : adminNotes.trim();

    if (status) feedback.status = status;
    if (nextResponse !== undefined) feedback.adminNotes = nextResponse;

    await feedback.save();

    if (nextResponse && nextResponse !== previousResponse && feedback.user) {
      try {
        const notification = await Notification.create({
          recipient: feedback.user,
          sender: adminId,
          type: 'FeedbackResponse',
          content: `An admin responded to your feedback${feedback.subject ? `: ${feedback.subject}` : '.'}`,
          link: '/settings?tab=feedback'
        });
        emitNotificationToUser(feedback.user, notification);
      } catch (notificationError) {
        console.error('Failed to notify user about feedback response:', notificationError.message);
      }
    }

    return feedback;
  }

  async deleteFeedback(id) {
    const feedback = await this.repo.findById(id);
    if (!feedback) {
      throw new AppError(404, 'Feedback entry not found.');
    }

    await feedback.deleteOne();
    return true;
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;
