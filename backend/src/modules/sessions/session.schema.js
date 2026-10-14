import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const sessionStatusEnum = z.enum([
  'Pending',
  'Accepted',
  'Declined',
  'Completed',
  'Cancelled'
]);

export const bookSessionSchema = z.object({
  body: z.object({
    mentorId: objectIdSchema,
    skillId: objectIdSchema.optional(),
    topic: z.string().trim().max(200).optional().default('Skill Exchange Session'),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid startTime date format'
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid endTime date format'
    }),
    notes: z.string().max(1000).optional().default(''),
    meetingLink: z.string().max(500).optional(),
    meetingLinkProvider: z.string().max(50).optional().default('Google Meet'),
    meetingLinkSharedBy: z.enum(['mentor', 'learner', 'either']).optional().default('either')
  }).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime']
  })
});

export const updateMeetingLinkSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    meetingLink: z.string().trim().min(1, 'Meeting link cannot be empty').max(500),
    meetingLinkProvider: z.string().max(50).optional()
  })
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const respondToSessionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: sessionStatusEnum.optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  })
});
