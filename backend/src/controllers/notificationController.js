import Notification from '../models/Notification.js';

const visibleNotificationQuery = (userId, extra = {}) => ({
  recipient: userId,
  $or: [
    { sender: { $exists: false } },
    { sender: null },
    { sender: { $ne: userId } }
  ],
  ...extra
});

export const getNotificationSummary = async (req, res) => {
  try {
    const unread = await Notification.find(visibleNotificationQuery(req.user._id, { isRead: false }))
      .select('type link createdAt')
      .limit(1000)
      .lean();

    const byLink = unread.reduce((acc, notification) => {
      const key = notification.link || notification.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      totalUnread: unread.length,
      byLink
    });
  } catch (error) {
    console.error('Notification Summary Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const notifications = await Notification.find(visibleNotificationQuery(req.user._id))
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name profileImage username')
      .lean();

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('Notification List Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

export const markNotificationsRead = async (req, res) => {
  const { id, link, type } = req.body;

  try {
    const query = {
      ...visibleNotificationQuery(req.user._id),
      isRead: false
    };

    if (id) query._id = id;
    if (link) query.link = link;
    if (type) query.type = type;

    await Notification.updateMany(query, { $set: { isRead: true } });

    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Notification Read Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
};
