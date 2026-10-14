import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    limit: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 50 : Math.min(100, Math.max(1, parsed));
    })
  })
});

export const markNotificationsReadSchema = z.object({
  body: z.object({
    id: objectIdSchema.optional(),
    link: z.string().max(500).optional(),
    type: z.string().max(100).optional()
  })
});
