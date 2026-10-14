import reviewRepository from './review.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import { invalidateUserDashboard, invalidateAdminStats } from '../../services/cacheService.js';

export class ReviewService {
  constructor(repo = reviewRepository) {
    this.repo = repo;
  }

  async createReview({ userId, sessionId, rating, feedback }) {
    if (!sessionId || !rating || !feedback?.trim()) {
      throw new AppError(400, 'Session, rating and feedback are required');
    }

    const session = await this.repo.findSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const isLearner = session.learner.toString() === userId.toString();
    if (!isLearner) {
      throw new AppError(403, 'Only the learner can review this session');
    }

    if (session.status !== 'Completed') {
      throw new AppError(400, 'Only completed sessions can be reviewed');
    }

    const review = await this.repo.upsertReview({
      sessionId: session._id,
      reviewerId: userId,
      revieweeId: session.mentor,
      rating: Math.max(1, Math.min(5, Number(rating))),
      feedback: feedback.trim()
    });

    await Promise.allSettled([
      invalidateUserDashboard(session.mentor),
      invalidateAdminStats()
    ]);

    return review;
  }

  async getReviewsForUser(userId) {
    return this.repo.findByReviewee(userId);
  }
}

export const reviewService = new ReviewService();
export default reviewService;
