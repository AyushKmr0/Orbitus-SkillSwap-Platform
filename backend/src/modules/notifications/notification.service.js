import notificationRepository from './notification.repository.js';

export class NotificationService {
  constructor(repo = notificationRepository) {
    this.repo = repo;
  }

  async getSummary(userId) {
    const unread = await this.repo.findUnreadSummary(userId);

    const byLink = unread.reduce((acc, notification) => {
      const key = notification.link || notification.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUnread: unread.length,
      byLink
    };
  }

  async getNotifications(userId, limit = 50) {
    return this.repo.findByRecipient(userId, limit);
  }

  async markAsRead(userId, { id, link, type } = {}) {
    return this.repo.markAsRead(userId, { id, link, type });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
