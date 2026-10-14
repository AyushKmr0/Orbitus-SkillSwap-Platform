import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const leaderboardQuerySchema = z.object({
  query: z.object({
    timeframe: z.enum(['weekly', 'monthly', 'all-time']).optional()
  }).optional()
});

export const adminPaginationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    role: z.string().optional()
  }).optional()
});

export const updateAdminUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    role: z.enum(['User', 'Admin'])
  })
});

export const adminDeleteIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Notification title is required').max(200),
    content: z.string().min(1, 'Notification content is required').max(2000)
  })
});
