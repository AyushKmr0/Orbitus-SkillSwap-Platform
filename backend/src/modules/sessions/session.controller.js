import sessionService from './session.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

const getPublicBaseUrl = (req) => (
  process.env.PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  `${req.protocol}://${req.get('host')}`
).replace(/\/$/, '');

export const bookSession = asyncHandler(async (req, res) => {
  const session = await sessionService.bookSession(req.user, req.body);

  return res.status(201).json(
    new ApiResponse(201, { session }, 'Session booking requested successfully!')
  );
});

export const updateMeetingLink = asyncHandler(async (req, res) => {
  const { meetingLink, meetingLinkProvider } = req.body;
  const session = await sessionService.updateMeetingLink(req.user, req.params.id, {
    meetingLink,
    meetingLinkProvider
  });

  return res.status(200).json(
    new ApiResponse(200, { session }, 'Meeting link updated successfully!')
  );
});

export const startSession = asyncHandler(async (req, res) => {
  const sessionStartedAt = await sessionService.startSession(req.user, req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { sessionStartedAt }, 'Session timer started')
  );
});

export const endSession = asyncHandler(async (req, res) => {
  const session = await sessionService.endSession(req.user, req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { session }, `Session ended. Total duration: ${session.actualDurationMinutes} minutes.`)
  );
});

export const respondToSession = asyncHandler(async (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const { status, startTime, endTime } = req.body;
  const session = await sessionService.respondToSession(
    req.user,
    req.params.id,
    { status, startTime, endTime },
    baseUrl
  );

  return res.status(200).json(
    new ApiResponse(200, { session }, `Session status updated to ${status}!`)
  );
});

export const getSessionHistory = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getSessionHistory(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, { sessions }, 'Session history retrieved')
  );
});
