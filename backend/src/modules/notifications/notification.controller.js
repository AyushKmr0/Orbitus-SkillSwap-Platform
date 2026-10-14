import notificationService from './notification.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

export const getNotificationSummary = asyncHandler(async (req, res) => {
  const summary = await notificationService.getSummary(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, summary, 'Notification summary retrieved')
  );
});

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 50;
  const notifications = await notificationService.getNotifications(req.user._id, limit);

  return res.status(200).json(
    new ApiResponse(200, { notifications }, 'Notifications retrieved')
  );
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  const { id, link, type } = req.body;
  await notificationService.markAsRead(req.user._id, { id, link, type });

  return res.status(200).json(
    new ApiResponse(200, null, 'Notifications marked as read')
  );
});
