import Session from '../models/Session.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Notification from '../models/Notification.js';
import Badge from '../models/Badge.js';
import Certificate from '../models/Certificate.js';
import QRCode from 'qrcode';

const JOIN_WINDOW_BEFORE_MINUTES = Number(process.env.SESSION_JOIN_WINDOW_BEFORE_MINUTES) || 5;
const MIN_ATTENDANCE_MINUTES = Number(process.env.SESSION_MIN_ATTENDANCE_MINUTES) || 45;
const MIN_ATTENDANCE_RATIO = Number(process.env.SESSION_MIN_ATTENDANCE_RATIO) || 0.75;

const getPublicBaseUrl = (req) => (
  process.env.PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  `${req.protocol}://${req.get('host')}`
).replace(/\/$/, '');

const getScheduledDurationMinutes = (session) => Math.max(
  0,
  Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)
);

const getDocumentId = (value) => (value?._id || value)?.toString();

const getJoinWindowState = (session, now = new Date()) => {
  const startAt = new Date(session.startTime);
  const endAt = new Date(session.endTime);
  const opensAt = new Date(startAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60 * 1000);

  if (now < opensAt) {
    return { state: 'Upcoming', canJoin: false, opensAt, startAt, endAt };
  }

  if (now > endAt) {
    return { state: 'Session Ended', canJoin: false, opensAt, startAt, endAt };
  }

  return { state: 'Join Available', canJoin: true, opensAt, startAt, endAt };
};

const calculateAttendanceMinutes = (session) => {
  if (!Array.isArray(session.attendance)) return 0;

  const sessionStart = new Date(session.startTime).getTime();
  const sessionEnd = new Date(session.endTime).getTime();
  const intervalsByRole = session.attendance.reduce((totals, item) => {
    if (!item.joinedAt || !item.leftAt || !item.role) return totals;

    const start = Math.max(new Date(item.joinedAt).getTime(), sessionStart);
    const end = Math.min(new Date(item.leftAt).getTime(), sessionEnd);
    if (end <= start) return totals;

    totals[item.role] ||= [];
    totals[item.role].push([start, end]);
    return totals;
  }, {});

  const sumMergedMinutes = (intervals = []) => {
    if (intervals.length === 0) return 0;

    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const merged = [];

    sorted.forEach(([start, end]) => {
      const last = merged[merged.length - 1];
      if (!last || start > last[1]) {
        merged.push([start, end]);
      } else {
        last[1] = Math.max(last[1], end);
      }
    });

    return merged.reduce((total, [start, end]) => (
      total + Math.max(0, Math.round((end - start) / 60000))
    ), 0);
  };

  const mentorMinutes = sumMergedMinutes(intervalsByRole.mentor);
  const learnerMinutes = sumMergedMinutes(intervalsByRole.learner);
  if (!mentorMinutes || !learnerMinutes) {
    return 0;
  }

  return Math.min(mentorMinutes, learnerMinutes, getScheduledDurationMinutes(session));
};

const getCompletionThresholdMinutes = (session) => {
  const scheduledDuration = getScheduledDurationMinutes(session);
  return Math.min(MIN_ATTENDANCE_MINUTES, Math.ceil(scheduledDuration * MIN_ATTENDANCE_RATIO));
};

const awardMentorBadges = async (mentorId, points) => {
  const completedMentorSessions = await Session.countDocuments({
    mentor: mentorId,
    status: 'Completed',
    pointsAwarded: true
  });

  const badgeNames = [];
  if (completedMentorSessions >= 1) badgeNames.push('Beginner Mentor');
  if (completedMentorSessions >= 3) badgeNames.push('Skilled Mentor');
  if (completedMentorSessions >= 10) badgeNames.push('Master Mentor');
  if (points >= 300) badgeNames.push('Top Contributor');

  await Promise.all(badgeNames.map(name => Badge.findOneAndUpdate(
    { user: mentorId, name },
    { $setOnInsert: { user: mentorId, name, unlockedAt: new Date() } },
    { upsert: true }
  )));
};

const issueCertificate = async (session, req) => {
  const existing = await Certificate.findOne({
    recipient: session.learner._id,
    skill: session.skill._id
  });
  if (existing) return existing;

  const uniqueId = `ORBITUS-${session.skill._id.toString().slice(-6).toUpperCase()}-${session.learner._id.toString().slice(-6).toUpperCase()}-${Date.now()}`;
  const verifyUrl = `${getPublicBaseUrl(req)}/api/certificates/verify/${uniqueId}`;
  const verificationQrCode = await QRCode.toDataURL(verifyUrl);

  return Certificate.create({
    recipient: session.learner._id,
    skill: session.skill._id,
    uniqueId,
    verificationQrCode
  });
};

// @desc    Book a new learning session
// @route   POST /api/sessions/book
// @access  Private
export const bookSession = async (req, res) => {
  const { mentorId, skillId, startTime, endTime, notes } = req.body;

  try {
    if (!mentorId || !skillId || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required parameters' });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const safeMentorName = mentor.name.replace(/[^a-z0-9]/gi, '');
    const jitsiRoomId = `Orbitus-${safeMentorName}-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`;

    const session = await Session.create({

      mentor: mentorId,
      learner: req.user._id,
      skill: skillId,
      startTime,
      endTime,
      status: 'Pending',
      jitsiRoomId,
      notes: notes || ''
    });

    // Create Notification for the mentor
    await Notification.create({
      recipient: mentorId,
      sender: req.user._id,
      type: 'SessionBooked',
      content: `${req.user.name} has requested a skill session on ${new Date(startTime).toLocaleDateString()}.`,
      link: '/bookings'
    });

    res.status(201).json({ success: true, message: 'Session booking requested successfully!', session });
  } catch (error) {
    console.error('Book Session Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error booking learning session' });
  }
};

// @desc    Respond to a booking request (Accept/Reject/Complete)
// @route   PUT /api/sessions/:id/respond
// @access  Private
export const respondToSession = async (req, res) => {
  const { id } = req.params;
  const { status, startTime, endTime } = req.body; // Status: Accepted, Rejected, Rescheduled, Completed, Cancelled

  try {
    const session = await Session.findById(id).populate('mentor learner skill');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session booking not found' });
    }

    // Authorization checks: Only mentor or learner can modify
    const mentorId = getDocumentId(session.mentor);
    const learnerId = getDocumentId(session.learner);
    const currentUserId = req.user._id.toString();
    const isMentor = mentorId === currentUserId;
    const isLearner = learnerId === currentUserId;

    if (!isMentor && !isLearner) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this booking' });
    }

    if (startTime || endTime) {
      if (!startTime || !endTime) {
        return res.status(400).json({ success: false, message: 'Changing time requires both start and end times' });
      }
      session.startTime = startTime;
      session.endTime = endTime;
    }

    if (status === 'Rescheduled') {
      session.status = 'Rescheduled';
    } else {
      session.status = status;
    }

    const durationMinutes = Math.max(0, Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000));

    // Gamification Points award: completed sessions of at least 60 minutes award +50 pts to mentor
    if (status === 'Completed') {
      if (!isMentor) {
        return res.status(403).json({ success: false, message: 'Only the mentor can mark this session complete' });
      }

      const actualDurationMinutes = calculateAttendanceMinutes(session);
      const requiredAttendanceMinutes = getCompletionThresholdMinutes(session);

      if (durationMinutes < 60) {
        return res.status(400).json({
          success: false,
          message: 'Session must be at least 60 minutes to mark complete and award points.'
        });
      }

      if (actualDurationMinutes < requiredAttendanceMinutes) {
        return res.status(400).json({
          success: false,
          message: `Session needs at least ${requiredAttendanceMinutes} minutes of actual attendance before completion. Current attendance: ${actualDurationMinutes} minutes.`
        });
      }

      session.actualDurationMinutes = actualDurationMinutes;

      const awardClaim = await Session.updateOne(
        { _id: session._id, pointsAwarded: false },
        {
          $set: {
            pointsAwarded: true,
            actualDurationMinutes,
            status: 'Completed'
          }
        }
      );

      if (awardClaim.modifiedCount > 0) {
        const mentor = await User.findById(session.mentor._id);
        mentor.points += 50;
        await mentor.save();

        await Leaderboard.findOneAndUpdate(
          { user: mentor._id },
          { $inc: { points: 50 } },
          { upsert: true }
        );
        session.pointsAwarded = true;
        await awardMentorBadges(mentor._id, mentor.points);
      }

      session.pointsAwarded = true;
      await session.save();
      const certificate = await issueCertificate(session, req);

      // Create Notification for the learner prompting them to write a review
      await Notification.create({
        recipient: session.learner._id,
        sender: session.mentor._id,
        type: 'BadgeUnlocked', // Re-used for system achievement alerts
        content: `Your session with ${session.mentor.name} is complete! Tap here to leave them a rating and review.`,
        link: '/bookings'
      });

      await Notification.create({
        recipient: session.learner._id,
        sender: session.mentor._id,
        type: 'CertificateGenerated',
        content: `Your ${session.skill.name} certificate is ready. Certificate ID: ${certificate.uniqueId}`,
        link: '/dashboard'
      });
    } else {
      await session.save();

      // Standard Response alerts
      const recipient = isMentor ? session.learner._id : session.mentor._id;
      await Notification.create({
        recipient,
        sender: req.user._id,
        type: 'SessionBooked',
        content: `${req.user.name} set the session status to: ${status}.`,
        link: '/bookings'
      });
    }

    res.status(200).json({ success: true, message: `Session status updated to ${status}!`, session });
  } catch (error) {
    console.error('Session Response Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error responding to session booking' });
  }
};

// @desc    Validate and start an accepted session call
// @route   POST /api/sessions/:id/join
// @access  Private
export const joinSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await Session.findById(id).populate('mentor learner skill');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session booking not found' });
    }

    const mentorId = getDocumentId(session.mentor);
    const learnerId = getDocumentId(session.learner);
    const currentUserId = req.user._id.toString();
    const isMentor = mentorId === currentUserId;
    const isLearner = learnerId === currentUserId;

    if (!isMentor && !isLearner) {
      return res.status(403).json({ success: false, message: 'Not authorized to join this session' });
    }

    if (!['Accepted', 'Rescheduled'].includes(session.status)) {
      return res.status(400).json({ success: false, message: 'Only accepted sessions can be joined' });
    }

    const joinWindow = getJoinWindowState(session);
    if (!joinWindow.canJoin) {
      return res.status(403).json({
        success: false,
        message: joinWindow.state === 'Upcoming'
          ? `Join opens ${JOIN_WINDOW_BEFORE_MINUTES} minutes before the session starts.`
          : 'This session has ended.',
        joinWindow
      });
    }

    const attendanceDebug = (session.attendance || []).map(item => ({
      user: getDocumentId(item.user),
      role: item.role,
      joinedAt: item.joinedAt,
      leftAt: item.leftAt,
      isMentorUser: getDocumentId(item.user) === mentorId
    }));
    const mentorHasActiveAttendance = session.attendance?.some(item => {
      if (item.leftAt) return false;
      const attendeeId = getDocumentId(item.user);
      return item.role === 'mentor' || attendeeId === mentorId;
    });
    const mentorStartedRoom = getDocumentId(session.roomStartedBy) === mentorId && Boolean(session.roomStartedAt);
    const mentorHasActiveRoom = mentorHasActiveAttendance || mentorStartedRoom;

    console.log('[SESSION JOIN DEBUG]', {
      sessionId: session._id.toString(),
      requesterId: currentUserId,
      mentorId,
      learnerId,
      isMentor,
      isLearner,
      status: session.status,
      room: session.jitsiRoomId,
      roomStartedBy: getDocumentId(session.roomStartedBy),
      roomStartedAt: session.roomStartedAt,
      mentorHasActiveAttendance,
      mentorStartedRoom,
      mentorHasActiveRoom,
      attendance: attendanceDebug
    });

    if (!isMentor && !mentorHasActiveRoom) {
      return res.status(403).json({
        success: false,
        message: 'The mentor needs to start the room first so the session has a host.'
      });
    }

    const now = new Date();
    const role = isMentor ? 'mentor' : 'learner';
    const openAttendance = session.attendance?.find(item => (
      item.user.toString() === req.user._id.toString() && !item.leftAt
    ));

    if (!session.actualStartTime) {
      session.actualStartTime = now;
    }

    if (isMentor && !session.roomStartedAt) {
      session.roomStartedAt = now;
      session.roomStartedBy = req.user._id;
    }

    if (!openAttendance) {
      session.attendance.push({
        user: req.user._id,
        role,
        joinedAt: now
      });
    } else if (!openAttendance.role) {
      openAttendance.role = role;
    }

    await session.save();

    const displayName = `${req.user.name}${isMentor ? ' (Mentor)' : ''}`;
    const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(session.jitsiRoomId)}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(displayName)}"&userInfo.email="${encodeURIComponent(req.user.email || '')}"`;

    console.log('[SESSION JOIN]', {
      sessionId: session._id.toString(),
      userId: req.user._id.toString(),
      role,
      room: session.jitsiRoomId,
      joinedAt: now.toISOString()
    });

    res.status(200).json({
      success: true,
      roomId: session.jitsiRoomId,
      jitsiUrl,
      role,
      isModeratorExpected: isMentor,
      joinWindow,
      message: isMentor
        ? 'Mentor joined as expected host for this Orbitus room.'
        : 'Learner joined the approved Orbitus room.'
    });
  } catch (error) {
    console.error('Session Join Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error joining session' });
  }
};

// @desc    Record session leave event
// @route   POST /api/sessions/:id/leave
// @access  Private
export const leaveSession = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session booking not found' });
    }

    const isParticipant = [session.mentor.toString(), session.learner.toString()]
      .includes(req.user._id.toString());

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to leave this session' });
    }

    const now = new Date();
    const openAttendance = session.attendance?.slice().reverse().find(item => (
      item.user.toString() === req.user._id.toString() && !item.leftAt
    ));

    if (openAttendance) {
      openAttendance.leftAt = now;
      openAttendance.durationMinutes = Math.max(
        0,
        Math.round((now - new Date(openAttendance.joinedAt)) / 60000)
      );
    }

    session.actualEndTime = now;
    session.actualDurationMinutes = calculateAttendanceMinutes(session);
    await session.save();

    console.log('[SESSION LEAVE]', {
      sessionId: session._id.toString(),
      userId: req.user._id.toString(),
      actualDurationMinutes: session.actualDurationMinutes
    });

    res.status(200).json({
      success: true,
      actualDurationMinutes: session.actualDurationMinutes
    });
  } catch (error) {
    console.error('Session Leave Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error recording session attendance' });
  }
};

// @desc    Get session booking history for current user (both as mentor and learner)
// @route   GET /api/sessions/history
// @access  Private
export const getSessionHistory = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ mentor: req.user._id }, { learner: req.user._id }]
    })
      .populate('mentor learner', 'name profileImage bio experienceLevel points')
      .populate('skill', 'name category')
      .sort({ startTime: -1 });

    const sessionsWithJoinState = sessions.map((session) => {
      const obj = session.toObject();
      obj.joinWindow = getJoinWindowState(session);
      obj.completionThresholdMinutes = getCompletionThresholdMinutes(session);
      return obj;
    });

    res.status(200).json({ success: true, sessions: sessionsWithJoinState });
  } catch (error) {
    console.error('Fetch Session History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching session logs' });
  }
};
