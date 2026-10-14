import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../modules/notifications/notification.service.js';
import { getNotificationsQuerySchema, markNotificationsReadSchema } from '../modules/notifications/notification.schema.js';
import Notification from '../models/Notification.js';

describe('Notification Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('should clamp query limit between 1 and 100', () => {
      const result = getNotificationsQuerySchema.safeParse({
        query: { limit: '250' }
      });
      expect(result.success).toBe(true);
      expect(result.data.query.limit).toBe(100);
    });

    it('should accept valid markRead payload with id and type', () => {
      const result = markNotificationsReadSchema.safeParse({
        body: { id: '65f123456789abcdef123456', type: 'feedback' }
      });
      expect(result.success).toBe(true);
      expect(result.data.body.type).toBe('feedback');
    });
  });

  describe('Notification Service', () => {
    it('should calculate unread summary grouped by link', async () => {
      const mockUnread = [
        { type: 'feedback', link: '/admin?tab=feedbacks', createdAt: new Date() },
        { type: 'feedback', link: '/admin?tab=feedbacks', createdAt: new Date() },
        { type: 'session', link: '/bookings', createdAt: new Date() }
      ];

      vi.spyOn(Notification, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockUnread)
          })
        })
      });

      const summary = await notificationService.getSummary('user-1');

      expect(summary.totalUnread).toBe(3);
      expect(summary.byLink['/admin?tab=feedbacks']).toBe(2);
      expect(summary.byLink['/bookings']).toBe(1);
    });

    it('should mark notifications as read', async () => {
      vi.spyOn(Notification, 'updateMany').mockResolvedValue({ modifiedCount: 2 });

      const result = await notificationService.markAsRead('user-1', { link: '/bookings' });
      expect(result.modifiedCount).toBe(2);
    });
  });
});
