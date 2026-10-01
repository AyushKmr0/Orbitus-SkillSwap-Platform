import Session from '../models/Session.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Notification from '../models/Notification.js';
import Badge from '../models/Badge.js';
import Certificate from '../models/Certificate.js';
import QRCode from 'qrcode';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const getPublicBaseUrl = (req) => (
  process.env.PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  `${req.protocol}://${req.get('host')}`
).replace(/\/$/, '');

const getDocumentId = (value) => (value?._id || value)?.toString();

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

  await Promise.all(badgeNames.map((name) => Badge.findOneAndUpdate(
    { user: mentorId, name },
    { $setOnInsert: { user: mentorId, name, unlockedAt: new Date() } },
    { upsert: true }
  )));
};

const issueCertificate = async (session, req) => {
  const skillId = session.skill?._id || session.skill;
  if (!skillId) return null;

  const existing = await Certificate.findOne({
    recipient: session.learner._id,
    skill: skillId
  });
  if (existing) return existing;

  const uniqueId = `ORBITUS-${skillId.toString().slice(-6).toUpperCase()}-${session.learner._id.toString().slice(-6).toUpperCase()}-${Date.now()}`;
  const verifyUrl = `${getPublicBaseUrl(req)}/api/certificates/verify/${uniqueId}`;
  const verificationQrCode = await QRCode.toDataURL(verifyUrl);

  return Certificate.create({
    recipient: session.learner._id,
    skill: skillId,
    uniqueId,
    verificationQrCode
  });
};

export const bookSession = asyncHandler(async (req, res) => {
  const {
    mentorId,
    skillId,
    topic,
    startTime,
    endTime,
    notes,
    meetingLink,
    meetingLinkProvider,
    meetingLinkSharedBy
  } = req.body;

  if (!mentorId || !startTime || !endTime) {
    throw new ApiError(400, 'Please provide mentor, start time, and end time');
  }

  const mentor = await User.findById(mentorId);
  if (!mentor) {
    throw new ApiError(404, 'Mentor not found');
  }

  const hasLink = Boolean(meetingLink && meetingLink.trim());

  const sessionData = {
    mentor: mentorId,
    learner: req.user._id,
    topic: (topic && topic.trim()) || 'Skill Exchange Session',
    startTime,
    endTime,
    status: 'Pending',
    notes: notes || '',
    meetingLink: hasLink ? meetingLink.trim() : '',
    meetingLinkProvider: meetingLinkProvider || 'Google Meet',
    meetingLinkSharedBy: meetingLinkSharedBy || 'either',
    meetingLinkAddedBy: hasLink ? req.user._id : undefined,
    meetingLinkAddedAt: hasLink ? new Date() : undefined
  };

  if (skillId) {
    sessionData.skill = skillId;
  }

  const session = await Session.create(sessionData);

  await Notification.create({
    recipient: mentorId,
    sender: req.user._id,
    type: 'SessionBooked',
    content: `${req.user.name} has requested a study session: "${sessionData.topic}" on ${new Date(startTime).toLocaleDateString()}.`,
    link: '/bookings'
  });

  return res.status(201).json(
    new ApiResponse(201, { session }, 'Session booking requested successfully!')
  );
});

export const updateMeetingLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { meetingLink, meetingLinkProvider } = req.body;

  if (!meetingLink || !meetingLink.trim()) {
    throw new ApiError(400, 'Meeting link cannot be empty');
  }

  const session = await Session.findById(id).populate('mentor learner skill');
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const mentorId = getDocumentId(session.mentor);
  const learnerId = getDocumentId(session.learner);
  const currentUserId = req.user._id.toString();
  const isMentor = mentorId === currentUserId;
  const isLearner = learnerId === currentUserId;

  if (!isMentor && !isLearner) {
    throw new ApiError(403, 'Not authorized to modify this session');
  }

  if (session.meetingLinkSharedBy === 'mentor' && !isMentor) {
    throw new ApiError(403, 'This session is configured for the mentor to share the video call link.');
  }
  if (session.meetingLinkSharedBy === 'learner' && !isLearner) {
    throw new ApiError(403, 'This session is configured for the learner to share the video call link.');
  }

  session.meetingLink = meetingLink.trim();
  if (meetingLinkProvider) {
    session.meetingLinkProvider = meetingLinkProvider;
  }
  session.meetingLinkAddedBy = req.user._id;
  session.meetingLinkAddedAt = new Date();
  await session.save();

  const recipientId = isMentor ? session.learner._id : session.mentor._id;
  await Notification.create({
    recipient: recipientId,
    sender: req.user._id,
    type: 'SessionBooked',
    content: `${req.user.name} added the video call link (${session.meetingLinkProvider}) for your session.`,
    link: '/bookings'
  });

  return res.status(200).json(
    new ApiResponse(200, { session }, 'Meeting link updated successfully!')
  );
});

export const startSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await Session.findById(id).populate('mentor learner');
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const mentorId = getDocumentId(session.mentor);
  const learnerId = getDocumentId(session.learner);
  const currentUserId = req.user._id.toString();

  if (mentorId !== currentUserId && learnerId !== currentUserId) {
    throw new ApiError(403, 'Not authorized');
  }

  if (!session.sessionStartedAt) {
    session.sessionStartedAt = new Date();
    await session.save();
  }

  return res.status(200).json(
    new ApiResponse(200, { sessionStartedAt: session.sessionStartedAt }, 'Session timer started')
  );
});

export const endSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await Session.findById(id).populate('mentor learner');
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const mentorId = getDocumentId(session.mentor);
  const learnerId = getDocumentId(session.learner);
  const currentUserId = req.user._id.toString();

  if (mentorId !== currentUserId && learnerId !== currentUserId) {
    throw new ApiError(403, 'Not authorized');
  }

  const now = new Date();
  session.sessionEndedAt = now;

  if (session.sessionStartedAt) {
    session.actualDurationMinutes = Math.max(1, Math.round((now - new Date(session.sessionStartedAt)) / 60000));
  } else {
    const scheduledMinutes = Math.max(0, Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000));
    session.actualDurationMinutes = scheduledMinutes;
  }

  await session.save();

  return res.status(200).json(
    new ApiResponse(200, { session }, `Session ended. Total duration: ${session.actualDurationMinutes} minutes.`)
  );
});

export const respondToSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, startTime, endTime } = req.body;

  const session = await Session.findById(id).populate('mentor learner skill');
  if (!session) {
    throw new ApiError(404, 'Session booking not found');
  }

  const mentorId = getDocumentId(session.mentor);
  const learnerId = getDocumentId(session.learner);
  const currentUserId = req.user._id.toString();
  const isMentor = mentorId === currentUserId;
  const isLearner = learnerId === currentUserId;

  if (!isMentor && !isLearner) {
    throw new ApiError(403, 'Not authorized to respond to this booking');
  }

  if (startTime || endTime) {
    if (!startTime || !endTime) {
      throw new ApiError(400, 'Changing time requires both start and end times');
    }
    session.startTime = startTime;
    session.endTime = endTime;
  }

  if (status) {
    session.status = status;
    if (status === 'Accepted' && !session.acceptedAt) {
      session.acceptedAt = new Date();
    }
  }

  if (status === 'Completed') {
    if (!isMentor) {
      throw new ApiError(403, 'Only the mentor can mark this session as completed');
    }

    if (!session.sessionEndedAt) {
      session.sessionEndedAt = new Date();
    }

    // Calculate actual meeting duration from start/accept time to marked complete time
    const startTimeRef = session.sessionStartedAt || session.acceptedAt || session.startTime || session.createdAt || new Date();
    const computedDuration = Math.max(1, Math.round((new Date(session.sessionEndedAt) - new Date(startTimeRef)) / 60000));
    session.actualDurationMinutes = computedDuration;

    // Calculate dynamic karma points based on meeting duration (base 25 + 1.5 pts per min, capped at 200 pts)
    const meetingPoints = Math.max(25, Math.min(200, Math.round(computedDuration * 1.5) || 50));

    // Immediately remove meeting link upon completion
    session.meetingLink = '';
    session.meetingLinkProvider = '';
    session.meetingLinkAddedBy = null;

    const awardClaim = await Session.updateOne(
      { _id: session._id, pointsAwarded: false },
      {
        $set: {
          pointsAwarded: true,
          status: 'Completed',
          actualDurationMinutes: session.actualDurationMinutes,
          sessionEndedAt: session.sessionEndedAt,
          meetingLink: '',
          meetingLinkProvider: '',
          meetingLinkAddedBy: null
        }
      }
    );

    if (awardClaim.modifiedCount > 0) {
      const mentor = await User.findById(session.mentor._id);
      mentor.points = (mentor.points || 0) + meetingPoints;
      await mentor.save();

      await Leaderboard.findOneAndUpdate(
        { user: mentor._id },
        { $inc: { points: meetingPoints } },
        { upsert: true }
      );
      session.pointsAwarded = true;
      await awardMentorBadges(mentor._id, mentor.points);

      // Award learner attendance & learning points
      const learnerPoints = Math.max(10, Math.round(meetingPoints * 0.5));
      const learnerUser = await User.findById(session.learner._id);
      if (learnerUser) {
        learnerUser.points = (learnerUser.points || 0) + learnerPoints;
        await learnerUser.save();
        await Leaderboard.findOneAndUpdate(
          { user: learnerUser._id },
          { $inc: { points: learnerPoints } },
          { upsert: true }
        );
      }
    }

    session.pointsAwarded = true;
    await session.save();

    const certificate = await issueCertificate(session, req);

    await Notification.create({
      recipient: session.learner._id,
      sender: session.mentor._id,
      type: 'BadgeUnlocked',
      content: `Your session with ${session.mentor.name} is complete! Duration: ${session.actualDurationMinutes} mins (+${meetingPoints} pts). Tap to leave a rating.`,
      link: '/bookings'
    });

    if (certificate) {
      await Notification.create({
        recipient: session.learner._id,
        sender: session.mentor._id,
        type: 'CertificateGenerated',
        content: `Your verified certificate is ready! ID: ${certificate.uniqueId}`,
        link: '/dashboard'
      });
    }
  } else {
    await session.save();

    const recipient = isMentor ? session.learner._id : session.mentor._id;
    await Notification.create({
      recipient,
      sender: req.user._id,
      type: 'SessionBooked',
      content: `${req.user.name} set the session status to: ${status}.`,
      link: '/bookings'
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { session }, `Session status updated to ${status}!`)
  );
});

export const getSessionHistory = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    $or: [{ mentor: req.user._id }, { learner: req.user._id }]
  })
    .populate('mentor learner', 'name username profileImage bio experienceLevel points')
    .populate('skill', 'name category')
    .populate('meetingLinkAddedBy', 'name username')
    .sort({ startTime: -1 });

  return res.status(200).json(
    new ApiResponse(200, { sessions }, 'Session history retrieved')
  );
});
