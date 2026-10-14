import sessionRepository from './session.repository.js';
import Notification from '../../models/Notification.js';
import Session from '../../models/Session.js';
import QRCode from 'qrcode';
import { AppError } from '../../shared/errors/app-error.js';
import { invalidateUserAndLeaderboard, invalidateAdminStats } from '../../services/cacheService.js';
import { activityService } from '../../services/activityService.js';

const getDocumentId = (value) => (value?._id || value)?.toString();

export class SessionService {
  constructor(repo = sessionRepository) {
    this.repo = repo;
  }

  async awardMentorBadges(mentorId, points) {
    const completedMentorSessions = await this.repo.countCompletedMentorSessions(mentorId);

    const badgeNames = [];
    if (completedMentorSessions >= 1) badgeNames.push('Beginner Mentor');
    if (completedMentorSessions >= 3) badgeNames.push('Skilled Mentor');
    if (completedMentorSessions >= 10) badgeNames.push('Master Mentor');
    if (points >= 300) badgeNames.push('Top Contributor');

    await Promise.all(badgeNames.map((name) => this.repo.unlockBadge(mentorId, name)));
  }

  async issueCertificate(session, baseUrl) {
    const skillId = session.skill?._id || session.skill;
    if (!skillId) return null;

    const existing = await this.repo.findCertificate(session.learner._id, skillId);
    if (existing) return existing;

    const uniqueId = `ORBITUS-${skillId.toString().slice(-6).toUpperCase()}-${session.learner._id.toString().slice(-6).toUpperCase()}-${Date.now()}`;
    const verifyUrl = `${baseUrl}/api/certificates/verify/${uniqueId}`;
    const verificationQrCode = await QRCode.toDataURL(verifyUrl);

    return this.repo.createCertificate({
      recipient: session.learner._id,
      skill: skillId,
      uniqueId,
      verificationQrCode
    });
  }

  async bookSession(currentUser, data) {
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
    } = data;

    if (!mentorId || !startTime || !endTime) {
      throw new AppError(400, 'Please provide mentor, start time, and end time');
    }

    const mentor = await this.repo.findUserById(mentorId);
    if (!mentor) {
      throw new AppError(404, 'Mentor not found');
    }

    const hasLink = Boolean(meetingLink && meetingLink.trim());

    const sessionData = {
      mentor: mentorId,
      learner: currentUser._id,
      topic: (topic && topic.trim()) || 'Skill Exchange Session',
      startTime,
      endTime,
      status: 'Pending',
      notes: notes || '',
      meetingLink: hasLink ? meetingLink.trim() : '',
      meetingLinkProvider: meetingLinkProvider || 'Google Meet',
      meetingLinkSharedBy: meetingLinkSharedBy || 'either',
      meetingLinkAddedBy: hasLink ? currentUser._id : undefined,
      meetingLinkAddedAt: hasLink ? new Date() : undefined
    };

    if (skillId) {
      sessionData.skill = skillId;
    }

    const session = await this.repo.create(sessionData);

    await Notification.create({
      recipient: mentorId,
      sender: currentUser._id,
      type: 'SessionBooked',
      content: `${currentUser.name} has requested a study session: "${sessionData.topic}" on ${new Date(startTime).toLocaleDateString()}.`,
      link: '/bookings'
    });

    return session;
  }

  async updateMeetingLink(currentUser, sessionId, { meetingLink, meetingLinkProvider }) {
    if (!meetingLink || !meetingLink.trim()) {
      throw new AppError(400, 'Meeting link cannot be empty');
    }

    const session = await this.repo.findByIdWithParticipants(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const mentorId = getDocumentId(session.mentor);
    const learnerId = getDocumentId(session.learner);
    const currentUserId = currentUser._id.toString();
    const isMentor = mentorId === currentUserId;
    const isLearner = learnerId === currentUserId;

    if (!isMentor && !isLearner) {
      throw new AppError(403, 'Not authorized to modify this session');
    }

    if (session.meetingLinkSharedBy === 'mentor' && !isMentor) {
      throw new AppError(403, 'This session is configured for the mentor to share the video call link.');
    }
    if (session.meetingLinkSharedBy === 'learner' && !isLearner) {
      throw new AppError(403, 'This session is configured for the learner to share the video call link.');
    }

    session.meetingLink = meetingLink.trim();
    if (meetingLinkProvider) {
      session.meetingLinkProvider = meetingLinkProvider;
    }
    session.meetingLinkAddedBy = currentUser._id;
    session.meetingLinkAddedAt = new Date();
    await session.save();

    const recipientId = isMentor ? session.learner._id : session.mentor._id;
    await Notification.create({
      recipient: recipientId,
      sender: currentUser._id,
      type: 'SessionBooked',
      content: `${currentUser.name} added the video call link (${session.meetingLinkProvider}) for your session.`,
      link: '/bookings'
    });

    return session;
  }

  async startSession(currentUser, sessionId) {
    const session = await this.repo.findByIdWithParticipants(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const mentorId = getDocumentId(session.mentor);
    const learnerId = getDocumentId(session.learner);
    const currentUserId = currentUser._id.toString();

    if (mentorId !== currentUserId && learnerId !== currentUserId) {
      throw new AppError(403, 'Not authorized');
    }

    if (!session.sessionStartedAt) {
      session.sessionStartedAt = new Date();
      await session.save();
    }

    return session.sessionStartedAt;
  }

  async endSession(currentUser, sessionId) {
    const session = await this.repo.findByIdWithParticipants(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const mentorId = getDocumentId(session.mentor);
    const learnerId = getDocumentId(session.learner);
    const currentUserId = currentUser._id.toString();

    if (mentorId !== currentUserId && learnerId !== currentUserId) {
      throw new AppError(403, 'Not authorized');
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
    return session;
  }

  async respondToSession(currentUser, sessionId, { status, startTime, endTime }, baseUrl) {
    const session = await this.repo.findByIdWithParticipants(sessionId);
    if (!session) {
      throw new AppError(404, 'Session booking not found');
    }

    const mentorId = getDocumentId(session.mentor);
    const learnerId = getDocumentId(session.learner);
    const currentUserId = currentUser._id.toString();
    const isMentor = mentorId === currentUserId;
    const isLearner = learnerId === currentUserId;

    if (!isMentor && !isLearner) {
      throw new AppError(403, 'Not authorized to respond to this booking');
    }

    if (startTime || endTime) {
      if (!startTime || !endTime) {
        throw new AppError(400, 'Changing time requires both start and end times');
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
        throw new AppError(403, 'Only the mentor can mark this session as completed');
      }

      if (!session.sessionEndedAt) {
        session.sessionEndedAt = new Date();
      }

      const startTimeRef = session.sessionStartedAt || session.acceptedAt || session.startTime || session.createdAt || new Date();
      const computedDuration = Math.max(1, Math.round((new Date(session.sessionEndedAt) - new Date(startTimeRef)) / 60000));
      session.actualDurationMinutes = computedDuration;

      // Authoritative Scoring Policy: Mentor earns +50 pts, Learner earns +25 pts
      const meetingPoints = 50;
      const learnerPoints = 25;

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
        await activityService.recordSessionCompletion({
          sessionId: session._id,
          mentorId: session.mentor._id || session.mentor,
          learnerId: session.learner._id || session.learner,
          actualDurationMinutes: session.actualDurationMinutes
        });

        const mentor = await this.repo.findUserById(session.mentor._id);
        mentor.points = (mentor.points || 0) + meetingPoints;
        await mentor.save();

        await this.repo.updateLeaderboardPoints(mentor._id, meetingPoints);
        session.pointsAwarded = true;
        await this.awardMentorBadges(mentor._id, mentor.points);

        const learnerUser = await this.repo.findUserById(session.learner._id);
        if (learnerUser) {
          learnerUser.points = (learnerUser.points || 0) + learnerPoints;
          await learnerUser.save();
          await this.repo.updateLeaderboardPoints(learnerUser._id, learnerPoints);
        }

        await Promise.allSettled([
          invalidateUserAndLeaderboard(session.mentor._id || session.mentor),
          invalidateUserAndLeaderboard(session.learner._id || session.learner),
          invalidateAdminStats()
        ]);
      }

      session.pointsAwarded = true;
      await session.save();

      const certificate = await this.issueCertificate(session, baseUrl);

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
        sender: currentUser._id,
        type: 'SessionBooked',
        content: `${currentUser.name} set the session status to: ${status}.`,
        link: '/bookings'
      });
    }

    return session;
  }

  async getSessionHistory(userId) {
    return this.repo.findUserSessionHistory(userId);
  }
}

export const sessionService = new SessionService();
export default sessionService;
