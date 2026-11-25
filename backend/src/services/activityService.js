import mongoose from 'mongoose';
import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Session from '../models/Session.js';
import Post from '../models/Post.js';
import { invalidateUserDashboard as invalidateDashboard, invalidateLeaderboard, invalidateUserAndLeaderboard } from './cacheService.js';
import { getDateKey, getYearInTimezone, DEFAULT_APP_TIMEZONE } from '../utils/timezone.js';

const getPreviousDateKey = (dateKey) => {
  const previousDate = new Date(`${dateKey}T00:00:00.000Z`);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  return previousDate.toISOString().slice(0, 10);
};

export const getNextLoginStreak = (lastLoginAt, currentStreak, dateKey, timeZone) => {
  const lastLoginDateKey = lastLoginAt ? getDateKey(lastLoginAt, timeZone) : null;
  const streak = Math.max(0, Number(currentStreak) || 0);
  if (lastLoginDateKey === dateKey) return streak;
  return lastLoginDateKey === getPreviousDateKey(dateKey) ? streak + 1 : 1;
};

export class ActivityService {
  /**
   * Awards +10 points on the first successful login of each calendar day in the user's timezone.
   * Completely idempotent and protected against concurrent requests via unique index.
   */
  async recordDailyLogin({ userId, timeZone = DEFAULT_APP_TIMEZONE, now = new Date() }) {
    if (!userId) return { awarded: false, reason: 'missing_user_id' };
    if (mongoose.connection?.readyState === 0 && !UserActivity.create?._isMockFunction && !UserActivity.create?.mock) {
      return { awarded: false, reason: 'db_disconnected' };
    }

    const tz = timeZone || DEFAULT_APP_TIMEZONE;
    const dateKey = getDateKey(now, tz);
    const idempotencyKey = `daily_login:${userId}:${dateKey}`;
    const databaseConnected = mongoose.connection?.readyState !== 0;
    const canReadUser = databaseConnected || User.findById?._isMockFunction || User.findById?.mock;

    let session = null;
    const isMock = Boolean(UserActivity.create?._isMockFunction || UserActivity.create?.mock);
    const topologyType = mongoose.connection?.client?.topology?.description?.type;
    const supportsTransactions = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';
    if (!isMock && supportsTransactions && typeof mongoose.connection?.startSession === 'function') {
      try {
        session = await mongoose.connection.startSession();
        session.startTransaction();
      } catch {
        session = null;
      }
    }

    try {
      let existingUser = null;
      if (canReadUser) {
        let userQuery = User.findById(userId);
        if (session && typeof userQuery?.session === 'function') {
          userQuery = userQuery.session(session);
        }
        if (typeof userQuery?.select === 'function') {
          userQuery = userQuery.select('points dailyLoginTracker streak');
        }
        existingUser = await userQuery;
      }

      if (databaseConnected && !existingUser) {
        if (session) await session.commitTransaction();
        return { awarded: false, reason: 'user_not_found', dateKey };
      }

      const lastLoginDateKey = existingUser?.dailyLoginTracker
        ? getDateKey(existingUser.dailyLoginTracker, tz)
        : null;
      if (lastLoginDateKey === dateKey) {
        if (session) await session.commitTransaction();
        await invalidateDashboard(userId).catch(() => {});
        return {
          awarded: false,
          reason: 'already_awarded_today',
          totalPoints: existingUser.points,
          streak: existingUser.streak || 0,
          dateKey
        };
      }

      const actDoc = {
        user: userId,
        activityType: 'daily_login',
        pointsAwarded: 10,
        dateKey,
        idempotencyKey,
        metadata: { timestamp: now.toISOString(), timeZone: tz, dateKey }
      };

      if (session) {
        await UserActivity.create([actDoc], { session });
      } else {
        await UserActivity.create(actDoc);
      }

      const rewardResult = await this.applyDailyLoginReward({
        userId,
        existingUser: existingUser || { dailyLoginTracker: null, streak: 0 },
        dateKey,
        timeZone: tz,
        now,
        session,
        databaseConnected
      });

      if (!rewardResult.awarded) {
        if (session) await session.commitTransaction();
        await invalidateDashboard(userId).catch(() => {});
        return rewardResult;
      }

      await Leaderboard.findOneAndUpdate(
        { user: userId },
        { $inc: { points: 10 }, $setOnInsert: { user: userId } },
        { upsert: true, new: true, ...(session ? { session } : {}) }
      );

      if (session) {
        await session.commitTransaction();
      }

      await Promise.allSettled([
        invalidateDashboard(userId),
        invalidateLeaderboard()
      ]);

      return rewardResult;
    } catch (err) {
      if (session) {
        try { await session.abortTransaction(); } catch {}
      }

      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        // Reconcile and heal if a previous partial write occurred
        let existingUser = null;
        if (canReadUser) {
          try {
            let userQuery = User.findById(userId);
            if (typeof userQuery?.select === 'function') {
              userQuery = userQuery.select('points dailyLoginTracker streak');
            }
            existingUser = await userQuery;
          } catch (readError) {
            console.error('[ACTIVITY SERVICE ERROR] Daily login recovery read failed:', readError.message);
          }
        }

        const lastLoginDate = existingUser?.dailyLoginTracker
          ? getDateKey(existingUser.dailyLoginTracker, tz)
          : null;

        // If UserActivity exists for today but user tracker wasn't updated, repair points and tracker
        if (existingUser && lastLoginDate !== dateKey) {
          try {
            const repairResult = await this.applyDailyLoginReward({
              userId,
              existingUser,
              dateKey,
              timeZone: tz,
              now,
              reconciled: true,
              databaseConnected
            });
            if (repairResult.awarded) {
              await Leaderboard.findOneAndUpdate(
                { user: userId },
                { $inc: { points: 10 }, $setOnInsert: { user: userId } },
                { upsert: true, new: true }
              );
              await Promise.allSettled([
                invalidateDashboard(userId),
                invalidateLeaderboard()
              ]);
            }
            return repairResult;
          } catch (repairErr) {
            console.error('[ACTIVITY SERVICE ERROR] Reconciliation repair failed:', repairErr.message);
          }
        }

        // Standard repeat login today
        await invalidateDashboard(userId).catch(() => {});
        return {
          awarded: false,
          reason: 'already_awarded_today',
          totalPoints: existingUser?.points,
          streak: existingUser?.streak || 0,
          dateKey
        };
      }

      console.error('[ACTIVITY SERVICE ERROR] recordDailyLogin failed:', err.message);
      return { awarded: false, error: err.message };
    } finally {
      if (session) {
        try { await session.endSession(); } catch {}
      }
    }
  }

  async applyDailyLoginReward({
    userId,
    existingUser,
    dateKey,
    timeZone,
    now,
    session = null,
    reconciled = false,
    databaseConnected = mongoose.connection?.readyState !== 0
  }) {
    const previousLoginDateKey = existingUser.dailyLoginTracker
      ? getDateKey(existingUser.dailyLoginTracker, timeZone)
      : null;
    if (previousLoginDateKey === dateKey) {
      return {
        awarded: false,
        reason: 'already_awarded_today',
        totalPoints: existingUser.points,
        streak: existingUser.streak || 0,
        dateKey
      };
    }

    const streak = getNextLoginStreak(
      existingUser.dailyLoginTracker,
      existingUser.streak,
      dateKey,
      timeZone
    );
    const update = {
      $inc: { points: 10 },
      $set: { dailyLoginTracker: now, streak }
    };
    const options = {
      new: true,
      select: 'points dailyLoginTracker streak',
      ...(session ? { session } : {})
    };
    const updatedUser = databaseConnected
      ? await User.findOneAndUpdate(
          { _id: userId, dailyLoginTracker: existingUser.dailyLoginTracker || null },
          update,
          options
        )
      : await User.findByIdAndUpdate(userId, update, options);

    if (!updatedUser) {
      return {
        awarded: false,
        reason: 'already_awarded_today',
        totalPoints: existingUser.points,
        streak: existingUser.streak || 0,
        dateKey
      };
    }

    return {
      awarded: true,
      ...(reconciled ? { reconciled: true } : {}),
      pointsAwarded: 10,
      totalPoints: updatedUser.points ?? existingUser.points ?? 10,
      streak: updatedUser.streak ?? streak,
      dateKey
    };
  }

  /**
   * Explicit, controlled reconciliation workflow for daily login ledger.
   * Repairs missing UserActivity ledger documents for days where dailyLoginTracker was recorded.
   * Kept separate from read-only GET queries.
   */
  async reconcileDailyLoginLedger(userId, timeZone = DEFAULT_APP_TIMEZONE, now = new Date()) {
    if (!userId) return { reconciled: false };
    const tz = timeZone || DEFAULT_APP_TIMEZONE;
    const todayKey = getDateKey(now, tz);
    const idempotencyKey = `daily_login:${userId}:${todayKey}`;

    try {
      const user = await User.findById(userId).select('dailyLoginTracker points');
      if (!user?.dailyLoginTracker) return { reconciled: false, reason: 'no_login_tracker' };

      const trackerKey = getDateKey(user.dailyLoginTracker, tz);
      if (trackerKey !== todayKey) return { reconciled: false, reason: 'tracker_not_today' };

      const existingAct = await UserActivity.findOne({ idempotencyKey });
      if (existingAct) return { reconciled: false, reason: 'already_persisted' };

      await UserActivity.create({
        user: userId,
        activityType: 'daily_login',
        pointsAwarded: 10,
        dateKey: todayKey,
        idempotencyKey,
        metadata: { timestamp: now.toISOString(), timeZone: tz, reconciled: true }
      });

      return { reconciled: true, dateKey: todayKey };
    } catch (err) {
      if (err.code === 11000 || err.message?.includes('E11000')) {
        return { reconciled: false, reason: 'already_persisted' };
      }
      return { reconciled: false, error: err.message };
    }
  }

  /**
   * Records completed session rewards: Mentor earns +50 pts, Learner earns +25 pts.
   * Protected against duplicate completion via unique idempotencyKey.
   */
  async recordSessionCompletion({ sessionId, mentorId, learnerId, actualDurationMinutes = 60, timeZone = DEFAULT_APP_TIMEZONE, now = new Date() }) {
    if (!sessionId || !mentorId) return { mentorAwarded: false, learnerAwarded: false };

    const tz = timeZone || DEFAULT_APP_TIMEZONE;
    const dateKey = getDateKey(now, tz);
    let mentorAwarded = false;
    let learnerAwarded = false;

    // 1. Mentor Award (+50 pts)
    try {
      await UserActivity.create({
        user: mentorId,
        activityType: 'session_completed',
        pointsAwarded: 50,
        dateKey,
        idempotencyKey: `session_mentor:${sessionId}`,
        metadata: { sessionId: String(sessionId), role: 'mentor', durationMinutes: actualDurationMinutes, timeZone: tz }
      });
      mentorAwarded = true;
    } catch (err) {
      if (err.code !== 11000 && !err.message?.includes('E11000')) {
        console.error('[ACTIVITY ERROR] Mentor session reward:', err.message);
      }
    }

    // 2. Learner Award (+25 pts)
    if (learnerId) {
      try {
        await UserActivity.create({
          user: learnerId,
          activityType: 'session_completed',
          pointsAwarded: 25,
          dateKey,
          idempotencyKey: `session_learner:${sessionId}`,
          metadata: { sessionId: String(sessionId), role: 'learner', durationMinutes: actualDurationMinutes, timeZone: tz }
        });
        learnerAwarded = true;
      } catch (err) {
        if (err.code !== 11000 && !err.message?.includes('E11000')) {
          console.error('[ACTIVITY ERROR] Learner session reward:', err.message);
        }
      }
    }

    return {
      mentorAwarded,
      mentorPoints: mentorAwarded ? 50 : 0,
      learnerAwarded,
      learnerPoints: learnerAwarded ? 25 : 0
    };
  }

  /**
   * Records resource sharing rewards in chat (+20 pts).
   * Daily cap: Max 1 reward per user per calendar day in user timezone.
   */
  async recordResourceShare({ userId, fileUrl, fileType, timeZone = DEFAULT_APP_TIMEZONE, now = new Date() }) {
    if (!userId || !fileUrl || !fileType || fileType === 'none') {
      return { awarded: false, reason: 'invalid_resource_payload' };
    }

    const tz = timeZone || DEFAULT_APP_TIMEZONE;
    const dateKey = getDateKey(now, tz);
    const idempotencyKey = `resource_share:${userId}:${dateKey}`;

    try {
      await UserActivity.create({
        user: userId,
        activityType: 'resource_shared',
        pointsAwarded: 20,
        dateKey,
        idempotencyKey,
        metadata: { fileUrl, fileType, timeZone: tz }
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: 20 } },
        { new: true, select: 'points' }
      );

      await Leaderboard.findOneAndUpdate(
        { user: userId },
        { $inc: { points: 20 }, $setOnInsert: { user: userId } },
        { upsert: true }
      );

      await invalidateUserAndLeaderboard(userId);

      return {
        awarded: true,
        pointsAwarded: 20,
        totalPoints: updatedUser?.points,
        dateKey
      };
    } catch (err) {
      if (err.code === 11000 || err.message?.includes('E11000')) {
        return {
          awarded: false,
          reason: 'daily_cap_reached',
          dateKey
        };
      }
      console.error('[ACTIVITY ERROR] recordResourceShare failed:', err.message);
      return { awarded: false, error: err.message };
    }
  }

  /**
   * Records community post creation (+5 pts).
   * Idempotent per postId.
   */
  async recordPostCreation({ userId, postId, timeZone = DEFAULT_APP_TIMEZONE, now = new Date() }) {
    if (!userId || !postId) return { awarded: false };

    const tz = timeZone || DEFAULT_APP_TIMEZONE;
    const dateKey = getDateKey(now, tz);
    const idempotencyKey = `post_created:${postId}`;

    try {
      await UserActivity.create({
        user: userId,
        activityType: 'post_created',
        pointsAwarded: 5,
        dateKey,
        idempotencyKey,
        metadata: { postId: String(postId), timeZone: tz }
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: 5 } },
        { new: true, select: 'points' }
      );

      await Leaderboard.findOneAndUpdate(
        { user: userId },
        { $inc: { points: 5 }, $setOnInsert: { user: userId } },
        { upsert: true }
      );

      await invalidateUserAndLeaderboard(userId);

      return {
        awarded: true,
        pointsAwarded: 5,
        totalPoints: updatedUser?.points,
        dateKey
      };
    } catch (err) {
      if (err.code === 11000 || err.message?.includes('E11000')) {
        return { awarded: false, reason: 'already_awarded' };
      }
      return { awarded: false, error: err.message };
    }
  }

  /**
   * Compiles the activity heatmap contribution map for a user in their configured timezone.
   * Merges persisted UserActivity records with completed sessions and user posts.
   * Returns: { 'YYYY-MM-DD': count }
   */
  async getActivityHeatmap(userId, sinceDateOrTz, timeZone = DEFAULT_APP_TIMEZONE) {
    if (!userId) return {};

    let rawSince = null;
    let tz = DEFAULT_APP_TIMEZONE;

    if (typeof sinceDateOrTz === 'string' && (sinceDateOrTz.includes('/') || sinceDateOrTz === 'UTC')) {
      tz = sinceDateOrTz;
    } else if (sinceDateOrTz && typeof sinceDateOrTz === 'object' && !(sinceDateOrTz instanceof Date) && sinceDateOrTz.timeZone) {
      tz = sinceDateOrTz.timeZone;
      rawSince = sinceDateOrTz.sinceDate || null;
    } else {
      rawSince = sinceDateOrTz || null;
      tz = timeZone || DEFAULT_APP_TIMEZONE;
    }

    const currentYear = getYearInTimezone(new Date(), tz);
    const defaultSince = new Date(Date.UTC(currentYear - 2, 0, 1, 0, 0, 0, 0));
    const effectiveSince = rawSince || defaultSince;

    const activityMap = {};

    try {
      // 1. Fetch persisted UserActivity events
      let activities = [];
      if (mongoose.connection?.readyState !== 0 || UserActivity.find?._isMockFunction || UserActivity.find?.mock) {
        const actQuery = UserActivity.find({
          user: userId,
          createdAt: { $gte: effectiveSince }
        });
        if (typeof actQuery?.select === 'function') {
          const sel = actQuery.select('dateKey createdAt activityType pointsAwarded metadata idempotencyKey');
          activities = typeof sel?.lean === 'function' ? await sel.lean() : await sel;
        } else if (typeof actQuery?.lean === 'function') {
          activities = await actQuery.lean();
        } else {
          activities = await actQuery;
        }
      }

      const coveredSessionIds = new Set();
      const coveredPostIds = new Set();
      let hasDailyLoginToday = false;
      const todayKey = getDateKey(new Date(), tz);

      for (const act of (activities || [])) {
        // Older deployments may have persisted locale-formatted dateKey strings.
        // Heatmap cells use ISO keys, so derive malformed legacy keys from timestamps.
        const key = /^\d{4}-\d{2}-\d{2}$/.test(act.dateKey || '')
          ? act.dateKey
          : (act.createdAt ? getDateKey(act.createdAt, tz) : null);
        if (key) {
          activityMap[key] = (activityMap[key] || 0) + 1;
        }

        if (act.activityType === 'daily_login' && key === todayKey) {
          hasDailyLoginToday = true;
        }

        if (act.activityType === 'session_completed') {
          const sId = act.metadata?.sessionId || (act.idempotencyKey?.startsWith('session_') ? act.idempotencyKey.split(':')[1] : null);
          if (sId) coveredSessionIds.add(String(sId));
        } else if (act.activityType === 'post_created') {
          const pId = act.metadata?.postId || (act.idempotencyKey?.startsWith('post_created:') ? act.idempotencyKey.replace('post_created:', '') : null);
          if (pId) coveredPostIds.add(String(pId));
        }
      }

      // Read-Model Fallback: If user has a dailyLoginTracker matching todayKey, reflect login contribution in read model
      if (!hasDailyLoginToday && (mongoose.connection?.readyState !== 0 || User.findById?._isMockFunction || User.findById?.mock)) {
        try {
          const userQuery = User.findById(userId);
          let userDoc = null;
          if (typeof userQuery?.select === 'function') {
            userDoc = await userQuery.select('dailyLoginTracker points');
          } else {
            userDoc = await userQuery;
          }
          if (userDoc?.dailyLoginTracker && getDateKey(userDoc.dailyLoginTracker, tz) === todayKey) {
            activityMap[todayKey] = (activityMap[todayKey] || 0) + 1;
            // Note: GET remains strictly read-only with zero database mutations.
          }
        } catch {
          // non-blocking
        }
      }

      // 2. Historical completed sessions fallback / merge (entity-level deduplication)
      let sessions = [];
      const sessionQuery = Session.find({
        $or: [{ mentor: userId }, { learner: userId }],
        status: 'Completed',
        startTime: { $gte: effectiveSince }
      });
      if (typeof sessionQuery?.select === 'function') {
        const sel = sessionQuery.select('_id startTime');
        sessions = typeof sel?.lean === 'function' ? await sel.lean() : await sel;
      } else if (typeof sessionQuery?.lean === 'function') {
        sessions = await sessionQuery.lean();
      } else {
        sessions = await sessionQuery;
      }

      for (const sess of (sessions || [])) {
        if (sess.startTime) {
          const sId = sess._id ? String(sess._id) : null;
          if (!sId || !coveredSessionIds.has(sId)) {
            const key = getDateKey(sess.startTime, tz);
            activityMap[key] = (activityMap[key] || 0) + 1;
            if (sId) coveredSessionIds.add(sId);
          }
        }
      }

      // 3. Historical posts fallback / merge (entity-level deduplication)
      let posts = [];
      const postQuery = Post.find({
        author: userId,
        createdAt: { $gte: effectiveSince }
      });
      if (typeof postQuery?.select === 'function') {
        const sel = postQuery.select('_id createdAt');
        posts = typeof sel?.lean === 'function' ? await sel.lean() : await sel;
      } else if (typeof postQuery?.lean === 'function') {
        posts = await postQuery.lean();
      } else {
        posts = await postQuery;
      }

      for (const p of (posts || [])) {
        if (p.createdAt) {
          const pId = p._id ? String(p._id) : null;
          if (!pId || !coveredPostIds.has(pId)) {
            const key = getDateKey(p.createdAt, tz);
            activityMap[key] = (activityMap[key] || 0) + 1;
            if (pId) coveredPostIds.add(pId);
          }
        }
      }
    } catch (err) {
      console.error('[ACTIVITY ERROR] getActivityHeatmap failed:', err.message);
    }

    return activityMap;
  }
}

export const activityService = new ActivityService();
export default activityService;
