import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const feedbackCategoryEnum = z.enum([
  'Bug Report',
  'Feature Request',
  'Platform Feedback',
  'Support / Help',
  'Other'
]);

export const feedbackStatusEnum = z.enum(['unread', 'reviewed', 'resolved']);

export const submitFeedbackSchema = z.object({
  body: z.object({
    category: feedbackCategoryEnum.optional().default('Platform Feedback'),
    rating: z.union([z.number(), z.string()]).optional().transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 5 : Math.min(5, Math.max(1, num));
    }),
    subject: z.string().max(200).optional().default(''),
    message: z.string().trim().min(1, 'Please provide a feedback message.').max(5000)
  })
});

export const updateFeedbackStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: feedbackStatusEnum.optional(),
    adminNotes: z.string().trim().max(2000).optional()
  })
});

export const feedbackIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const adminFeedbackQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    category: z.string().optional()
  })
});
