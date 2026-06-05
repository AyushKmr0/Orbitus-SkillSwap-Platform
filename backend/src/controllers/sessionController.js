import Session from '../models/Session.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Notification from '../models/Notification.js';
import Badge from '../models/Badge.js';
import Certificate from '../models/Certificate.js';
import QRCode from 'qrcode';

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
  const verifyUrl = `${req.protocol}://${req.get('host')}/api/certificates/verify/${uniqueId}`;
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

    const jitsiRoomId = `Orbitus-${mentor.name.replace(/ /g, '')}-${Math.floor(100 + Math.random() * 900)}`;

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
    const isMentor = session.mentor._id.toString() === req.user._id.toString();
    const isLearner = session.learner._id.toString() === req.user._id.toString();

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
      if (durationMinutes < 60) {
        return res.status(400).json({
          success: false,
          message: 'Session must be at least 60 minutes to mark complete and award points.'
        });
      }

      if (!session.pointsAwarded) {
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

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Fetch Session History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching session logs' });
  }
};
