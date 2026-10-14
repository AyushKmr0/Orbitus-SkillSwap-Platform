import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema } from '../../shared/validation/common-schemas.js';

export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['User', 'Admin']).optional().default('User'),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().default(''),
    githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional().default('Beginner'),
    skillsTeach: z.array(z.any()).optional().default([]),
    skillsLearn: z.array(z.any()).optional().default([])
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: z.string().trim().min(6, 'Valid 6-digit OTP code is required').max(6)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema
  })
});

export const verifyAdminKeySchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    adminKey: z.string().min(1, 'Admin key is required')
  })
});
