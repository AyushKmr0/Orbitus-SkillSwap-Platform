import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../modules/reviews/review.service.js';
import { createReviewSchema } from '../modules/reviews/review.schema.js';
import Review from '../models/Review.js';
import Session from '../models/Session.js';

describe('Review Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should reject review with missing session id or feedback', () => {
      const result = createReviewSchema.safeParse({
        body: { rating: 5, feedback: '' }
      });
      expect(result.success).toBe(false);
    });

    it('should clamp rating between 1 and 5', () => {
      const result = createReviewSchema.safeParse({
        body: {
          sessionId: '65f123456789abcdef123456',
          rating: '10',
          feedback: 'Excellent guidance!'
        }
      });
      expect(result.success).toBe(true);
      expect(result.data.body.rating).toBe(5);
    });
  });

  describe('Review Service', () => {
    it('should throw 403 if reviewer is not the learner of the session', async () => {
      vi.spyOn(Session, 'findById').mockResolvedValue({
        _id: '65f123456789abcdef123456',
        learner: 'user-different',
        mentor: 'mentor-1',
        status: 'Completed'
      });

      await expect(
        reviewService.createReview({
          userId: 'user-me',
          sessionId: '65f123456789abcdef123456',
          rating: 5,
          feedback: 'Loved it'
        })
      ).rejects.toThrow('Only the learner can review this session');
    });

    it('should throw 400 if session is not Completed', async () => {
      vi.spyOn(Session, 'findById').mockResolvedValue({
        _id: '65f123456789abcdef123456',
        learner: 'user-me',
        mentor: 'mentor-1',
        status: 'In-Progress'
      });

      await expect(
        reviewService.createReview({
          userId: 'user-me',
          sessionId: '65f123456789abcdef123456',
          rating: 5,
          feedback: 'Loved it'
        })
      ).rejects.toThrow('Only completed sessions can be reviewed');
    });

    it('should successfully upsert review for completed session by learner', async () => {
      vi.spyOn(Session, 'findById').mockResolvedValue({
        _id: '65f123456789abcdef123456',
        learner: 'user-me',
        mentor: 'mentor-1',
        status: 'Completed'
      });

      const mockReview = {
        _id: 'rev-1',
        session: '65f123456789abcdef123456',
        reviewer: 'user-me',
        reviewee: 'mentor-1',
        rating: 5,
        feedback: 'Super helpful session!'
      };

      vi.spyOn(Review, 'findOneAndUpdate').mockResolvedValue(mockReview);

      const review = await reviewService.createReview({
        userId: 'user-me',
        sessionId: '65f123456789abcdef123456',
        rating: 5,
        feedback: 'Super helpful session!'
      });

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
    });
  });
});
