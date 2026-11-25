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
    role: z.string().optional(),
    status: z.enum(['suspended']).optional()
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

const adminPermissionSchema = z.enum([
  'dashboard.read',
  'users.read',
  'users.manage',
  'content.read',
  'content.manage',
  'moderation.manage',
  'feedback.manage',
  'system.manage',
  'audit.read',
  'permissions.manage',
  'feature_flags.manage',
  'health.read'
]);

export const updateAdminUserAccessSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    accessLevel: z.enum(['full', 'moderator', 'support', 'analyst', 'custom']),
    permissions: z.array(adminPermissionSchema).max(12).optional().default([])
  }).superRefine((body, ctx) => {
    if (body.accessLevel === 'custom' && body.permissions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['permissions'],
        message: 'Select at least one permission for a custom access profile'
      });
    }
  })
});

export const suspendAdminUserSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    reason: z.string().trim().min(5).max(500),
    expiresAt: z.string().datetime().optional()
  })
});

export const restoreAdminUserSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    reason: z.string().trim().max(500).optional().default('')
  }).optional()
});

export const adminAuditQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    action: z.string().trim().max(120).optional()
  }).optional()
});

export const updateFeatureFlagSchema = z.object({
  params: z.object({
    key: z.enum(['userRegistration', 'postsEnabled', 'groupsEnabled', 'skillRequestsEnabled'])
  }),
  body: z.object({
    enabled: z.boolean()
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
