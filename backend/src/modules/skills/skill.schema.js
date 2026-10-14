import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/common-schemas.js';

export const createSkillSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Skill name is required').max(100),
    category: z.string().trim().min(1, 'Category is required').max(100),
    tags: z.union([
      z.array(z.string().max(50)),
      z.string().transform((str) => str.split(',').map((t) => t.trim()).filter(Boolean))
    ]).optional().default([]),
    description: z.string().max(1000).optional().default('')
  })
});

export const updateSkillSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(1, 'Skill name is required').max(100),
    category: z.string().trim().min(1, 'Category is required').max(100),
    tags: z.union([
      z.array(z.string().max(50)),
      z.string().transform((str) => str.split(',').map((t) => t.trim()).filter(Boolean))
    ]).optional().default([]),
    description: z.string().max(1000).optional().default('')
  })
});

export const skillIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const requestSkillSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Skill / Course name is required').max(100),
    category: z.string().trim().min(1, 'Category is required').max(100),
    description: z.string().max(1000).optional().default(''),
    tags: z.union([
      z.array(z.string().max(50)),
      z.string().transform((str) => str.split(',').map((t) => t.trim()).filter(Boolean))
    ]).optional().default([]),
    intent: z.enum(['teach', 'learn', 'both']).optional().default('teach'),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional().default('Intermediate')
  })
});

export const rejectSkillRequestSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    adminFeedback: z.string().max(1000).optional()
  })
});
