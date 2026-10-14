import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const chatRoomIdParamSchema = z.object({
  params: z.object({
    chatRoomId: z.string().min(1, 'Chat room ID is required')
  })
});

export const partnerIdParamSchema = z.object({
  params: z.object({
    partnerId: objectIdSchema
  })
});

export const getMessageHistorySchema = z.object({
  params: z.object({
    chatRoomId: z.string().min(1, 'Chat room ID is required')
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    cursor: z.string().optional(),
    before: z.string().optional()
  }).optional()
});
