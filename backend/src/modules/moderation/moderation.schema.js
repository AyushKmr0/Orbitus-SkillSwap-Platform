import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

const reportReasonSchema = z.enum([
  'spam',
  'harassment',
  'inappropriate',
  'misinformation',
  'other'
]);

export const createModerationReportSchema = z.object({
  body: z.object({
    targetType: z.enum(['post', 'group']),
    targetId: objectIdSchema,
    reason: reportReasonSchema,
    details: z.string().trim().max(1000).optional().default('')
  })
});

export const listModerationReportsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'resolved', 'dismissed', 'all']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
  }).optional()
});

export const reviewModerationReportSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    decision: z.enum(['resolved', 'dismissed']),
    removeContent: z.boolean().optional().default(false),
    resolutionNote: z.string().trim().max(500).optional().default('')
  })
});
