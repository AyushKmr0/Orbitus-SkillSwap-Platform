import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from '../modules/sessions/session.service.js';
import { bookSessionSchema, updateMeetingLinkSchema } from '../modules/sessions/session.schema.js';
import Session from '../models/Session.js';
import User from '../models/User.js';

describe('Session Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('should reject booking when endTime is before startTime', () => {
      const result = bookSessionSchema.safeParse({
        body: {
          mentorId: '65f123456789abcdef123456',
          startTime: '2026-10-15T15:00:00Z',
          endTime: '2026-10-15T14:00:00Z'
        }
      });
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('endTime must be after startTime');
    });

    it('should accept valid session booking data', () => {
      const result = bookSessionSchema.safeParse({
        body: {
          mentorId: '65f123456789abcdef123456',
          startTime: '2026-10-15T15:00:00Z',
          endTime: '2026-10-15T16:00:00Z',
          topic: 'React Performance Tuning'
        }
      });
      expect(result.success).toBe(true);
      expect(result.data.body.topic).toBe('React Performance Tuning');
    });

    it('should reject empty meeting link on update', () => {
      const result = updateMeetingLinkSchema.safeParse({
        params: { id: '65f123456789abcdef123456' },
        body: { meetingLink: '   ' }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Session Service', () => {
    it('should throw 404 when booking with non-existent mentor', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(null);

      await expect(
        sessionService.bookSession(
          { _id: 'learner-1', name: 'Learner' },
          {
            mentorId: '65f123456789abcdef123456',
            startTime: '2026-10-15T15:00:00Z',
            endTime: '2026-10-15T16:00:00Z'
          }
        )
      ).rejects.toThrow('Mentor not found');
    });

    it('should throw 403 when unauthorized user attempts to start session', async () => {
      vi.spyOn(Session, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: 'session-1',
          mentor: 'mentor-1',
          learner: 'learner-1'
        })
      });

      await expect(
        sessionService.startSession({ _id: 'stranger-user' }, 'session-1')
      ).rejects.toThrow('Not authorized');
    });
  });
});
