import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedbackService } from '../modules/feedback/feedback.service.js';
import { submitFeedbackSchema, updateFeedbackStatusSchema } from '../modules/feedback/feedback.schema.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

describe('Feedback Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('should reject feedback submission with empty message', () => {
      const result = submitFeedbackSchema.safeParse({
        body: { message: '   ' }
      });
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('Please provide a feedback message');
    });

    it('should accept valid feedback submission and apply default category', () => {
      const result = submitFeedbackSchema.safeParse({
        body: { message: 'This platform is wonderful!', rating: 5 }
      });
      expect(result.success).toBe(true);
      expect(result.data.body.category).toBe('Platform Feedback');
      expect(result.data.body.rating).toBe(5);
    });

    it('should reject updateFeedbackStatus with invalid ObjectId param', () => {
      const result = updateFeedbackStatusSchema.safeParse({
        params: { id: 'invalid-id' },
        body: { status: 'reviewed' }
      });
      expect(result.success).toBe(false);
      expect(result.error.errors[0].path).toContain('id');
    });
  });

  describe('Feedback Service', () => {
    it('should successfully submit feedback and dispatch admin notifications', async () => {
      const mockFeedback = {
        _id: '65f123456789abcdef123456',
        user: 'user-1',
        message: 'Great learning experience',
        rating: 5
      };

      vi.spyOn(Feedback, 'create').mockResolvedValue(mockFeedback);
      vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'admin-1' }])
      });
      vi.spyOn(Notification, 'insertMany').mockResolvedValue([
        { recipient: 'admin-1', type: 'FeedbackSubmitted' }
      ]);

      const result = await feedbackService.submitFeedback({
        userId: 'user-1',
        userName: 'Alice',
        category: 'Feature Request',
        rating: 5,
        subject: 'More Dark Mode themes',
        message: 'Great learning experience'
      });

      expect(result).toBeDefined();
      expect(result._id).toBe('65f123456789abcdef123456');
      expect(Notification.insertMany).toHaveBeenCalledTimes(1);
      expect(Notification.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({
          recipient: 'admin-1',
          type: 'FeedbackSubmitted',
          content: 'Alice submitted Feature Request feedback: More Dark Mode themes'
        })
      ]);
    });

    it('should throw 404 when updating nonexistent feedback entry', async () => {
      vi.spyOn(Feedback, 'findById').mockResolvedValue(null);

      await expect(
        feedbackService.updateFeedbackStatus('65f123456789abcdef123456', { status: 'resolved' })
      ).rejects.toThrow('Feedback entry not found');
    });

    it('should save a public admin response and notify the feedback author', async () => {
      const feedback = {
        user: 'user-1',
        subject: 'Group chat issue',
        adminNotes: '',
        save: vi.fn().mockResolvedValue(undefined)
      };
      vi.spyOn(Feedback, 'findById').mockResolvedValue(feedback);
      vi.spyOn(Notification, 'create').mockResolvedValue({
        _id: 'notification-1',
        recipient: 'user-1',
        type: 'FeedbackResponse'
      });

      await feedbackService.updateFeedbackStatus('feedback-1', {
        status: 'reviewed',
        adminNotes: '  Thanks for reporting this.\nWe are looking into it.  ',
        adminId: 'admin-1'
      });

      expect(feedback.adminNotes).toBe('Thanks for reporting this.\nWe are looking into it.');
      expect(feedback.save).toHaveBeenCalledOnce();
      expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
        recipient: 'user-1',
        sender: 'admin-1',
        type: 'FeedbackResponse',
        link: '/settings?tab=feedback'
      }));
    });
  });
});
