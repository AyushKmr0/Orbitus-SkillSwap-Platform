import Notification from '../models/Notification.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const visibleNotificationQuery = (userId, extra = {}) => ({
  recipient: userId,
  type: { $ne: 'NewMessage' },
  $or: [
    { sender: { $exists: false } },
    { sender: null },
    { sender: { $ne: userId } }
  ],
  ...extra
});

export const getNotificationSummary = asyncHandler(async (req, res) => {
  const unread = await Notification.find(visibleNotificationQuery(req.user._id, { isRead: false }))
    .select('type link createdAt')
    .limit(1000)
    .lean();

  const byLink = unread.reduce((acc, notification) => {
    const key = notification.link || notification.type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return res.status(200).json(
    new ApiResponse(200, {
      totalUnread: unread.length,
      byLink
    }, 'Notification summary retrieved')
  );
});

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const notifications = await Notification.find(visibleNotificationQuery(req.user._id))
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name profileImage username')
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { notifications }, 'Notifications retrieved')
  );
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const { id, link, type } = req.body;

  const query = {
    ...visibleNotificationQuery(req.user._id),
    isRead: false
  };

  if (id) query._id = id;
  if (link) query.link = link;
  if (type) query.type = type;

  await Notification.updateMany(query, { $set: { isRead: true } });

  return res.status(200).json(
    new ApiResponse(200, null, 'Notifications marked as read')
  );
});
