import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityService } from '../services/activityService.js';
import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Session from '../models/Session.js';
import Post from '../models/Post.js';

describe('Activity & Scoreboard Mechanics Full Regression Tests', () => {
  let activityService;

  beforeEach(() => {
    vi.clearAllMocks();
    activityService = new ActivityService();
  });

  describe('1. Daily Login Points Flow & Idempotency', () => {
    it('awards exactly 10 points on the first successful login of the day', async () => {
      const mockUserId = 'user_login_1';
      const now = new Date('2026-10-12T08:00:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({
        _id: 'act_1',
        user: mockUserId,
        activityType: 'daily_login',
        pointsAwarded: 10,
        dateKey: '2026-10-12',
        idempotencyKey: `daily_login:${mockUserId}:2026-10-12`
      });

      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
        _id: mockUserId,
        points: 110,
        dailyLoginTracker: now
      });

      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({
        user: mockUserId,
        points: 110
      });

      const result = await activityService.recordDailyLogin({ userId: mockUserId, now });

      expect(result.awarded).toBe(true);
      expect(result.pointsAwarded).toBe(10);
      expect(result.totalPoints).toBe(110);
      expect(result.dateKey).toBe('2026-10-12');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $inc: { points: 10 },
          $set: { dailyLoginTracker: now }
        }),
        expect.anything()
      );
    });

    it('prevents duplicate rewards for repeated same-day login (idempotent)', async () => {
      const mockUserId = 'user_login_2';
      const now = new Date('2026-10-12T14:30:00.000Z');

      const duplicateKeyError = new Error('E11000 duplicate key error');
      duplicateKeyError.code = 11000;
      vi.spyOn(UserActivity, 'create').mockRejectedValue(duplicateKeyError);
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(null);

      const result = await activityService.recordDailyLogin({ userId: mockUserId, now });

      expect(result.awarded).toBe(false);
      expect(result.reason).toBe('already_awarded_today');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('awards points on the next calendar day', async () => {
      const mockUserId = 'user_login_3';
      const nextDay = new Date('2026-10-13T09:00:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({
        user: mockUserId,
        activityType: 'daily_login',
        dateKey: '2026-10-13'
      });
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: mockUserId, points: 120 });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({ user: mockUserId, points: 120 });

      const result = await activityService.recordDailyLogin({ userId: mockUserId, now: nextDay });

      expect(result.awarded).toBe(true);
      expect(result.pointsAwarded).toBe(10);
      expect(result.dateKey).toBe('2026-10-13');
    });

    it('handles leap year date boundary (2024-02-29) properly', async () => {
      const mockUserId = 'user_leap_year';
      const leapDay = new Date('2024-02-29T12:00:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({
        user: mockUserId,
        activityType: 'daily_login',
        dateKey: '2024-02-29'
      });
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: mockUserId, points: 20 });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({ user: mockUserId, points: 20 });

      const result = await activityService.recordDailyLogin({ userId: mockUserId, now: leapDay });

      expect(result.awarded).toBe(true);
      expect(result.dateKey).toBe('2024-02-29');
    });

    it('safely handles missing leaderboard row by upserting', async () => {
      const mockUserId = 'user_missing_lb';
      const now = new Date('2026-10-12T00:00:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({ user: mockUserId });
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: mockUserId, points: 10 });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({ user: mockUserId, points: 10 });

      const result = await activityService.recordDailyLogin({ userId: mockUserId, now });

      expect(result.awarded).toBe(true);
      expect(Leaderboard.findOneAndUpdate).toHaveBeenCalledWith(
        { user: mockUserId },
        expect.objectContaining({ $inc: { points: 10 }, $setOnInsert: { user: mockUserId } }),
        expect.objectContaining({ upsert: true })
      );
    });

    it('rejects without error when userId is missing', async () => {
      const result = await activityService.recordDailyLogin({ userId: null });
      expect(result.awarded).toBe(false);
      expect(result.reason).toBe('missing_user_id');
    });
  });

  describe('2. Session Completion Scoring Policy (Mentor: +50, Learner: +25)', () => {
    it('awards mentor +50 and learner +25 with unique idempotency keys', async () => {
      const sessionId = 'sess_123';
      const mentorId = 'user_mentor_1';
      const learnerId = 'user_learner_1';

      vi.spyOn(UserActivity, 'create').mockImplementation(async (payload) => payload);

      const result = await activityService.recordSessionCompletion({
        sessionId,
        mentorId,
        learnerId,
        actualDurationMinutes: 60
      });

      expect(result.mentorAwarded).toBe(true);
      expect(result.mentorPoints).toBe(50);
      expect(result.learnerAwarded).toBe(true);
      expect(result.learnerPoints).toBe(25);

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mentorId,
          activityType: 'session_completed',
          pointsAwarded: 50,
          idempotencyKey: `session_mentor:${sessionId}`
        })
      );

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: learnerId,
          activityType: 'session_completed',
          pointsAwarded: 25,
          idempotencyKey: `session_learner:${sessionId}`
        })
      );
    });

    it('prevents duplicate awards if session completion is called again', async () => {
      const sessionId = 'sess_123';
      const mentorId = 'user_mentor_1';
      const learnerId = 'user_learner_1';

      const dupErr = new Error('E11000 duplicate');
      dupErr.code = 11000;
      vi.spyOn(UserActivity, 'create').mockRejectedValue(dupErr);

      const result = await activityService.recordSessionCompletion({
        sessionId,
        mentorId,
        learnerId
      });

      expect(result.mentorAwarded).toBe(false);
      expect(result.mentorPoints).toBe(0);
      expect(result.learnerAwarded).toBe(false);
      expect(result.learnerPoints).toBe(0);
    });
  });

  describe('3. Resource Sharing Anti-Spam Capping (+20 Points, 1/day Max)', () => {
    it('awards +20 points when a valid resource file is shared for the first time in a day', async () => {
      const userId = 'user_share_1';
      const now = new Date('2026-10-12T10:00:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({
        user: userId,
        activityType: 'resource_shared',
        pointsAwarded: 20
      });
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId, points: 50 });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({ user: userId, points: 50 });

      const result = await activityService.recordResourceShare({
        userId,
        fileUrl: 'https://cloudinary.com/notes.pdf',
        fileType: 'application/pdf',
        now
      });

      expect(result.awarded).toBe(true);
      expect(result.pointsAwarded).toBe(20);
      expect(result.totalPoints).toBe(50);
    });

    it('enforces daily cap when a user shares another file on the same day', async () => {
      const userId = 'user_share_1';
      const now = new Date('2026-10-12T11:00:00.000Z');

      const dupErr = new Error('E11000 duplicate key');
      dupErr.code = 11000;
      vi.spyOn(UserActivity, 'create').mockRejectedValue(dupErr);
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(null);

      const result = await activityService.recordResourceShare({
        userId,
        fileUrl: 'https://cloudinary.com/notes2.pdf',
        fileType: 'application/pdf',
        now
      });

      expect(result.awarded).toBe(false);
      expect(result.reason).toBe('daily_cap_reached');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects without points when fileUrl or fileType is missing/none', async () => {
      const result = await activityService.recordResourceShare({
        userId: 'u1',
        fileUrl: '',
        fileType: 'none'
      });
      expect(result.awarded).toBe(false);
      expect(result.reason).toBe('invalid_resource_payload');
    });
  });

  describe('4. Heatmap Contribution Aggregation', () => {
    it('returns an empty map for a new user with zero activities', async () => {
      vi.spyOn(UserActivity, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });
      vi.spyOn(Session, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });
      vi.spyOn(Post, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      const heatmap = await activityService.getActivityHeatmap('new_user_1');
      expect(heatmap).toEqual({});
      expect(Object.keys(heatmap).length).toBe(0);
    });

    it('aggregates multiple verified activities into daily count mapping', async () => {
      const userId = 'active_user_1';

      vi.spyOn(UserActivity, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { dateKey: '2026-10-10', activityType: 'daily_login' },
            { dateKey: '2026-10-10', activityType: 'session_completed' },
            { dateKey: '2026-10-11', activityType: 'resource_shared' },
            { dateKey: '2024-02-29', activityType: 'daily_login' } // Leap year check
          ])
        })
      });

      vi.spyOn(Session, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      vi.spyOn(Post, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { createdAt: new Date('2026-10-11T15:00:00Z') }
          ])
        })
      });

      const heatmap = await activityService.getActivityHeatmap(userId);

      expect(heatmap['2026-10-10']).toBe(2);
      expect(heatmap['2026-10-11']).toBe(2);
      expect(heatmap['2024-02-29']).toBe(1);
    });
  });
});
