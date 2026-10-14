import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

const MAX_POST_LENGTH = 2000;

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, 'Post content is required').max(MAX_POST_LENGTH, `Post content must be ${MAX_POST_LENGTH} characters or less`),
    project: z.object({
      title: z.string().max(200).optional(),
      description: z.string().max(1000).optional(),
      link: z.string().url().max(500).optional()
    }).passthrough().optional().default({})
  })
});

export const updatePostSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    content: z.string().trim().min(1, 'Post content is required').max(MAX_POST_LENGTH, `Post content must be ${MAX_POST_LENGTH} characters or less`)
  })
});

export const postIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const addCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    content: z.string().trim().min(1, 'Comment is required').max(1000, 'Comment must be 1000 characters or less'),
    parentCommentId: objectIdSchema.optional().nullable(),
    threadRootId: objectIdSchema.optional().nullable(),
    replyToCommentId: objectIdSchema.optional().nullable(),
    replyTo: objectIdSchema.optional().nullable()
  })
});

export const editCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    commentId: objectIdSchema
  }),
  body: z.object({
    content: z.string().trim().min(1, 'Comment content is required').max(1000, 'Comment must be 1000 characters or less')
  })
});

export const likeCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    commentId: objectIdSchema
  })
});

export const getCommentLikersQuerySchema = z.object({
  params: z.object({
    id: objectIdSchema,
    commentId: objectIdSchema
  }),
  query: z.object({
    limit: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 20 : Math.min(50, Math.max(1, parsed));
    }),
    page: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 1 : Math.max(1, parsed);
    })
  })
});

export const deleteCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    commentId: objectIdSchema
  })
});

export const getPostLikersQuerySchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  query: z.object({
    limit: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 20 : Math.min(50, Math.max(1, parsed));
    }),
    page: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 1 : Math.max(1, parsed);
    })
  })
});

export const getFeedPostsQuerySchema = z.object({
  query: z.object({
    limit: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 20 : Math.min(50, Math.max(1, parsed));
    }),
    page: z.union([z.number(), z.string()]).optional().transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 1 : Math.max(1, parsed);
    }),
    before: z.string().optional(),
    scope: z.enum(['all', 'my', 'following']).optional().default('all'),
    author: z.string().optional()
  })
});
