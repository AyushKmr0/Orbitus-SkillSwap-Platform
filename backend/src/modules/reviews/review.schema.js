import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const createReviewSchema = z.object({
  body: z.object({
    sessionId: objectIdSchema,
    rating: z.union([z.number(), z.string()]).transform((val) => {
      const num = Number(val);
      if (isNaN(num)) throw new Error('Rating must be a valid number');
      return Math.max(1, Math.min(5, Math.round(num)));
    }),
    feedback: z.string().trim().min(1, 'Feedback message is required').max(2000)
  })
});
