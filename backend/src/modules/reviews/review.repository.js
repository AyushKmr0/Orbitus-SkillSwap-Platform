import Review from '../../models/Review.js';
import Session from '../../models/Session.js';

export class ReviewRepository {
  async findSessionById(sessionId) {
    return Session.findById(sessionId);
  }

  async upsertReview({ sessionId, reviewerId, revieweeId, rating, feedback }) {
    return Review.findOneAndUpdate(
      { session: sessionId, reviewer: reviewerId },
      {
        session: sessionId,
        reviewer: reviewerId,
        reviewee: revieweeId,
        rating,
        feedback
      },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async findByReviewee(revieweeId, limit = 20) {
    return Review.find({ reviewee: revieweeId })
      .populate('reviewer', 'name username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

export const reviewRepository = new ReviewRepository();
export default reviewRepository;
