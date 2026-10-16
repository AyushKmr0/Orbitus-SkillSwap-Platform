import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityService } from '../services/activityService.js';
import UserActivity from '../models/UserActivity.js';
import Session from '../models/Session.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';

describe('Real getActivityHeatmap Execution & Aggregation Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(null)
    });
  });

  it('aggregates multiple distinct completed sessions on the same UTC date without undercounting', async () => {
    const userId = '65f123456789abcdef100001';

    // No persisted UserActivity records yet
    vi.spyOn(UserActivity, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    // 2 distinct completed sessions on the same date
    const session1 = {
      _id: '65f111111111111111111101',
      mentor: userId,
      status: 'Completed',
      startTime: new Date('2026-10-10T09:00:00.000Z')
    };
    const session2 = {
      _id: '65f111111111111111111102',
      mentor: userId,
      status: 'Completed',
      startTime: new Date('2026-10-10T14:30:00.000Z')
    };

    vi.spyOn(Session, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([session1, session2])
      })
    });

    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    const activityMap = await activityService.getActivityHeatmap(userId);

    expect(activityMap['2026-10-10']).toBe(2);
  });

  it('maps legacy locale-formatted activity keys to the canonical ISO heatmap date', async () => {
    const userId = '65f123456789abcdef100099';
    vi.spyOn(UserActivity, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{
          activityType: 'daily_login',
          dateKey: '10/16/2026',
          createdAt: new Date('2026-10-15T20:00:00.000Z')
        }])
      })
    });
    vi.spyOn(Session, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })
    });
    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })
    });

    const activityMap = await activityService.getActivityHeatmap(userId, null, 'Asia/Kolkata');

    expect(activityMap['2026-10-16']).toBe(1);
  });

  it('aggregates multiple posts created on the same UTC date', async () => {
    const userId = '65f123456789abcdef100002';

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

    const post1 = { _id: 'post_001', createdAt: new Date('2026-10-11T08:00:00.000Z') };
    const post2 = { _id: 'post_002', createdAt: new Date('2026-10-11T12:00:00.000Z') };
    const post3 = { _id: 'post_003', createdAt: new Date('2026-10-11T18:00:00.000Z') };

    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([post1, post2, post3])
      })
    });

    const activityMap = await activityService.getActivityHeatmap(userId);

    expect(activityMap['2026-10-11']).toBe(3);
  });

  it('deduplicates identical entities between UserActivity and historical models without double-counting', async () => {
    const userId = '65f123456789abcdef100003';
    const sessionId = '65f999999999999999999999';

    // Persisted UserActivity for this session
    const persistedSessionActivity = {
      _id: 'act_sess_1',
      user: userId,
      activityType: 'session_completed',
      dateKey: '2026-10-12',
      metadata: { sessionId },
      idempotencyKey: `session_mentor:${sessionId}`,
      createdAt: new Date('2026-10-12T10:00:00.000Z')
    };

    vi.spyOn(UserActivity, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([persistedSessionActivity])
      })
    });

    // Same session returned in historical query
    const historicalSession = {
      _id: sessionId,
      mentor: userId,
      status: 'Completed',
      startTime: new Date('2026-10-12T10:00:00.000Z')
    };

    vi.spyOn(Session, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([historicalSession])
      })
    });

    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    const activityMap = await activityService.getActivityHeatmap(userId);

    // Must be exactly 1, NOT 2!
    expect(activityMap['2026-10-12']).toBe(1);
  });

  it('counts both when a persisted event and a DIFFERENT historical entity occur on the same date', async () => {
    const userId = '65f123456789abcdef100004';
    const persistedSessionId = '65f111111111111111111111';
    const unpersistedHistoricalSessionId = '65f222222222222222222222';

    // 1. Persisted session activity
    const persistedSessionActivity = {
      _id: 'act_sess_persisted',
      user: userId,
      activityType: 'session_completed',
      dateKey: '2026-10-13',
      metadata: { sessionId: persistedSessionId },
      idempotencyKey: `session_mentor:${persistedSessionId}`,
      createdAt: new Date('2026-10-13T10:00:00.000Z')
    };

    vi.spyOn(UserActivity, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([persistedSessionActivity])
      })
    });

    // 2. Historical query returns BOTH sessions (the persisted one AND the other unpersisted one)
    const sess1 = {
      _id: persistedSessionId,
      status: 'Completed',
      startTime: new Date('2026-10-13T10:00:00.000Z')
    };
    const sess2 = {
      _id: unpersistedHistoricalSessionId,
      status: 'Completed',
      startTime: new Date('2026-10-13T16:00:00.000Z')
    };

    vi.spyOn(Session, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([sess1, sess2])
      })
    });

    vi.spyOn(Post, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    const activityMap = await activityService.getActivityHeatmap(userId);

    // 1 persisted + 1 distinct unpersisted = 2
    expect(activityMap['2026-10-13']).toBe(2);
  });

  it('returns exactly one contribution for a login-only day', async () => {
    const userId = '65f123456789abcdef100005';

    const loginAct = {
      _id: 'act_login_1',
      user: userId,
      activityType: 'daily_login',
      dateKey: '2026-10-14',
      createdAt: new Date('2026-10-14T05:30:00.000Z')
    };

    vi.spyOn(UserActivity, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([loginAct])
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

    const activityMap = await activityService.getActivityHeatmap(userId);

    expect(activityMap['2026-10-14']).toBe(1);
  });

  it('correctly maps dates across UTC boundaries and across multi-year ranges (2024, 2025, 2026)', async () => {
    const userId = '65f123456789abcdef100006';

    const multiYearActivities = [
      // Leap year 2024
      { dateKey: '2024-02-29', activityType: 'daily_login', createdAt: new Date('2024-02-29T23:59:59.000Z') },
      // Year boundary transition 2024 -> 2025
      { dateKey: '2024-12-31', activityType: 'daily_login', createdAt: new Date('2024-12-31T23:59:59.000Z') },
      { dateKey: '2025-01-01', activityType: 'daily_login', createdAt: new Date('2025-01-01T00:00:01.000Z') },
      // 2026
      { dateKey: '2026-10-14', activityType: 'daily_login', createdAt: new Date('2026-10-14T12:00:00.000Z') }
    ];

    vi.spyOn(UserActivity, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(multiYearActivities)
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

    const activityMap = await activityService.getActivityHeatmap(userId);

    expect(activityMap['2024-02-29']).toBe(1);
    expect(activityMap['2024-12-31']).toBe(1);
    expect(activityMap['2025-01-01']).toBe(1);
    expect(activityMap['2026-10-14']).toBe(1);
  });
});

describe('Daily Login Reward Consistency & Self-Healing Reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reconciles and awards points if UserActivity exists but user points update previously failed', async () => {
    const userId = '65f123456789abcdef200001';
    const now = new Date('2026-10-14T10:00:00.000Z');

    // Simulate UserActivity.create throwing E11000 duplicate (activity already recorded)
    const dupErr = new Error('E11000 duplicate key error');
    dupErr.code = 11000;
    vi.spyOn(UserActivity, 'create').mockRejectedValue(dupErr);

    // User was NOT updated on that day (dailyLoginTracker is yesterday)
    const existingUser = {
      _id: userId,
      points: 50,
      dailyLoginTracker: new Date('2026-10-13T10:00:00.000Z')
    };

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(existingUser)
    });

    const userUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
      _id: userId,
      points: 60,
      dailyLoginTracker: now
    });

    const leaderboardSpy = vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({
      user: userId,
      points: 60
    });

    const result = await activityService.recordDailyLogin({ userId, now });

    expect(result.awarded).toBe(true);
    expect(result.reconciled).toBe(true);
    expect(result.pointsAwarded).toBe(10);
    expect(result.totalPoints).toBe(60);
    expect(userUpdateSpy).toHaveBeenCalledWith(
      userId,
      { $inc: { points: 10 }, $set: { dailyLoginTracker: now } },
      { new: true, select: 'points dailyLoginTracker' }
    );
    expect(leaderboardSpy).toHaveBeenCalled();
  });

  it('does not duplicate points when reward was already successfully completed today', async () => {
    const userId = '65f123456789abcdef200002';
    const now = new Date('2026-10-14T15:00:00.000Z');

    const dupErr = new Error('E11000 duplicate key error');
    dupErr.code = 11000;
    vi.spyOn(UserActivity, 'create').mockRejectedValue(dupErr);

    // User WAS already updated today
    const existingUser = {
      _id: userId,
      points: 60,
      dailyLoginTracker: new Date('2026-10-14T08:00:00.000Z')
    };

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(existingUser)
    });

    const userUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate');

    const result = await activityService.recordDailyLogin({ userId, now });

    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('already_awarded_today');
    expect(result.totalPoints).toBe(60);
    // Must NOT increment points
    expect(userUpdateSpy).not.toHaveBeenCalled();
  });

  it('awards +10 points on the next UTC day cleanly', async () => {
    const userId = '65f123456789abcdef200003';
    const nextDay = new Date('2026-10-15T00:01:00.000Z');

    vi.spyOn(UserActivity, 'create').mockResolvedValue({});
    vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
      _id: userId,
      points: 70,
      dailyLoginTracker: nextDay
    });
    vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({
      user: userId,
      points: 70
    });

    const result = await activityService.recordDailyLogin({ userId, now: nextDay });

    expect(result.awarded).toBe(true);
    expect(result.pointsAwarded).toBe(10);
    expect(result.totalPoints).toBe(70);
    expect(result.dateKey).toBe('2026-10-15');
  });

  describe('Timezone Boundaries & Self-Healing', () => {
    it('determines dateKey as 2026-10-15 when login occurs at 00:05 AM IST (2026-10-14 18:35 UTC)', async () => {
      const userId = '65f123456789abcdef300001';
      // 18:35 UTC on Oct 14 is 00:05 AM IST on Oct 15
      const loginTime = new Date('2026-10-14T18:35:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({});
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
        _id: userId,
        points: 80,
        dailyLoginTracker: loginTime
      });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({
        user: userId,
        points: 80
      });

      const result = await activityService.recordDailyLogin({
        userId,
        now: loginTime,
        timeZone: 'Asia/Kolkata'
      });

      expect(result.awarded).toBe(true);
      expect(result.pointsAwarded).toBe(10);
      expect(result.dateKey).toBe('2026-10-15');
    });

    it('correctly handles leap day in Asia/Kolkata timezone (2024-02-28 18:35 UTC -> 2024-02-29 IST)', async () => {
      const userId = '65f123456789abcdef300002';
      const leapDayIst = new Date('2024-02-28T18:35:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({});
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
        _id: userId,
        points: 90,
        dailyLoginTracker: leapDayIst
      });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({
        user: userId,
        points: 90
      });

      const result = await activityService.recordDailyLogin({
        userId,
        now: leapDayIst,
        timeZone: 'Asia/Kolkata'
      });

      expect(result.awarded).toBe(true);
      expect(result.dateKey).toBe('2024-02-29');
    });

    it('correctly rolls over new year in Asia/Kolkata timezone (2026-12-31 18:35 UTC -> 2027-01-01 IST)', async () => {
      const userId = '65f123456789abcdef300003';
      const newYearIst = new Date('2026-12-31T18:35:00.000Z');

      vi.spyOn(UserActivity, 'create').mockResolvedValue({});
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
        _id: userId,
        points: 100,
        dailyLoginTracker: newYearIst
      });
      vi.spyOn(Leaderboard, 'findOneAndUpdate').mockResolvedValue({
        user: userId,
        points: 100
      });

      const result = await activityService.recordDailyLogin({
        userId,
        now: newYearIst,
        timeZone: 'Asia/Kolkata'
      });

      expect(result.awarded).toBe(true);
      expect(result.dateKey).toBe('2027-01-01');
    });

    it('reflects login contribution in getActivityHeatmap read model without mutating database', async () => {
      const userId = '65f123456789abcdef300004';
      const now = new Date();

      // No UserActivity found
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

      // User has logged in today
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          dailyLoginTracker: now,
          points: 110
        })
      });

      const createSpy = vi.spyOn(UserActivity, 'create');

      const activityMap = await activityService.getActivityHeatmap(userId, null, 'Asia/Kolkata');

      // The returned read-model map includes today's contribution
      const todayKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);

      expect(activityMap[todayKey]).toBeGreaterThanOrEqual(1);
      // STRICT REQUIREMENT: GET requests must NEVER mutate the database
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('reconciles missing ledger record in controlled idempotent workflow', async () => {
      const userId = '65f123456789abcdef300005';
      const now = new Date();
      const todayKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userId,
          dailyLoginTracker: now,
          points: 110
        })
      });
      vi.spyOn(UserActivity, 'findOne').mockResolvedValue(null);
      const createSpy = vi.spyOn(UserActivity, 'create').mockResolvedValue({});

      const result = await activityService.reconcileDailyLoginLedger(userId, 'Asia/Kolkata', now);

      expect(result.reconciled).toBe(true);
      expect(result.dateKey).toBe(todayKey);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          activityType: 'daily_login',
          dateKey: todayKey,
          idempotencyKey: `daily_login:${userId}:${todayKey}`
        })
      );
    });
  });
});
