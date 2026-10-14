import Notification from '../../models/Notification.js';

export const visibleNotificationQuery = (userId, extra = {}) => ({
  recipient: userId,
  type: { $ne: 'NewMessage' },
  $or: [
    { sender: { $exists: false } },
    { sender: null },
    { sender: { $ne: userId } }
  ],
  ...extra
});

export class NotificationRepository {
  async findUnreadSummary(userId) {
    return Notification.find(visibleNotificationQuery(userId, { isRead: false }))
      .select('type link createdAt')
      .limit(1000)
      .lean();
  }

  async findByRecipient(userId, limit = 50) {
    return Notification.find(visibleNotificationQuery(userId))
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name profileImage username')
      .lean();
  }

  async markAsRead(userId, { id, link, type } = {}) {
    const query = {
      ...visibleNotificationQuery(userId),
      isRead: false
    };

    if (id) query._id = id;
    if (link) query.link = link;
    if (type) query.type = type;

    return Notification.updateMany(query, { $set: { isRead: true } });
  }

  async create(data) {
    return Notification.create(data);
  }

  async insertMany(items) {
    return Notification.insertMany(items);
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
