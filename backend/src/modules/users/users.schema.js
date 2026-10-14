import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    username: z.string().trim().min(3).max(24).optional(),
    bio: z.string().max(500).optional(),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
    education: z.string().max(500).optional(),
    interests: z.array(z.string()).optional(),
    socialLinks: z.record(z.string(), z.string()).optional(),
    skillsTeach: z.array(z.any()).optional(),
    skillsLearn: z.array(z.any()).optional(),
    profileImage: z.string().max(500).optional(),
    coverImage: z.string().max(500).optional(),
    customAiProvider: z.string().max(50).optional(),
    projects: z.array(z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      githubUrl: z.string().optional(),
      liveUrl: z.string().optional(),
      featured: z.boolean().optional()
    })).optional(),
    resumeFile: z.string().max(500).optional(),
    role: z.string().optional()
  })
});

export const deleteAccountSchema = z.object({
  body: z.object({
    username: z.string().trim().min(1, 'Username is required to confirm deletion')
  })
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User identifier is required')
  })
});

export const searchUsersQuerySchema = z.object({
  query: z.object({
    q: z.string().optional()
  }).optional()
});

export const suggestedUsersQuerySchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    excludeFollowing: z.enum(['true', 'false']).optional(),
    shuffle: z.enum(['true', 'false']).optional()
  }).optional()
});
