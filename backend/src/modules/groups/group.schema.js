import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Group name is required').max(100),
    description: z.string().max(1000).optional().default(''),
    image: z.string().url().max(500).optional().or(z.literal('')),
    privacy: z.enum(['public', 'private']).optional().default('public'),
    category: z.string().trim().max(100).optional().default('General Learning'),
    tags: z.union([
      z.array(z.string().max(50)),
      z.string().transform((str) => str.split(',').map((t) => t.trim()).filter(Boolean))
    ]).optional().default([])
  })
});

export const updateGroupSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(1, 'Group name is required').max(100).optional(),
    description: z.string().max(1000).optional(),
    image: z.string().max(500).optional(),
    privacy: z.enum(['public', 'private']).optional(),
    category: z.string().trim().max(100).optional(),
    tags: z.union([
      z.array(z.string().max(50)),
      z.string().transform((str) => str.split(',').map((t) => t.trim()).filter(Boolean))
    ]).optional()
  })
});

export const groupIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const groupUserParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    userId: objectIdSchema
  })
});

export const groupMessageParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    msgId: objectIdSchema
  })
});

export const respondJoinRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    userId: objectIdSchema
  }),
  body: z.object({
    action: z.enum(['accept', 'reject'])
  })
});

export const manageMemberRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    userId: objectIdSchema
  }),
  body: z.object({
    action: z.enum(['make_admin', 'remove_admin', 'kick', 'ban'])
  })
});

export const updateGroupMeetingLinkSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    meetingLink: z.string().max(500).optional().default(''),
    meetingLinkProvider: z.string().max(50).optional().default('Google Meet')
  })
});

export const sendGroupMessageSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    content: z.string().max(5000).optional().default(''),
    fileUrl: z.string().max(500).optional(),
    fileType: z.string().max(50).optional(),
    fileName: z.string().max(200).optional(),
    fileSize: z.union([z.number(), z.string()]).optional(),
    replyTo: objectIdSchema.optional()
  }).refine((data) => (data.content && data.content.trim().length > 0) || Boolean(data.fileUrl), {
    message: 'Message must contain text content or a file attachment'
  })
});

export const addMemberSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    userId: objectIdSchema
  })
});
