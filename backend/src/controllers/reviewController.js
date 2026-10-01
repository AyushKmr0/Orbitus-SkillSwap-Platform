import Review from '../models/Review.js';
import Session from '../models/Session.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

export const createReview = asyncHandler(async (req, res) => {
  const { sessionId, rating, feedback } = req.body;

  if (!sessionId || !rating || !feedback?.trim()) {
    throw new ApiError(400, 'Session, rating and feedback are required');
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const isLearner = session.learner.toString() === req.user._id.toString();
  if (!isLearner) {
    throw new ApiError(403, 'Only the learner can review this session');
  }

  if (session.status !== 'Completed') {
    throw new ApiError(400, 'Only completed sessions can be reviewed');
  }

  const review = await Review.findOneAndUpdate(
    { session: session._id, reviewer: req.user._id },
    {
      session: session._id,
      reviewer: req.user._id,
      reviewee: session.mentor,
      rating: Math.max(1, Math.min(5, Number(rating))),
      feedback: feedback.trim()
    },
    { new: true, upsert: true, runValidators: true }
  );

  return res.status(201).json(
    new ApiResponse(201, { review }, 'Review published successfully')
  );
});
