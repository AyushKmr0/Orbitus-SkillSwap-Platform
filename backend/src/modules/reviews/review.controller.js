import reviewService from './review.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

export const createReview = asyncHandler(async (req, res) => {
  const { sessionId, rating, feedback } = req.body;

  const review = await reviewService.createReview({
    userId: req.user._id,
    sessionId,
    rating,
    feedback
  });

  return res.status(201).json(
    new ApiResponse(201, { review }, 'Review published successfully')
  );
});
