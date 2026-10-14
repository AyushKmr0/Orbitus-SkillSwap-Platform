import { z } from 'zod';
import mongoose from 'mongoose';

export const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format'
});

export const idParamSchema = z.object({
  id: objectIdSchema
});

export const paginationQuerySchema = z.object({
  page: z.union([z.string(), z.number()]).optional().transform((val) => Math.max(1, parseInt(val || '1', 10) || 1)),
  limit: z.union([z.string(), z.number()]).optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || '20', 10) || 20))),
  search: z.string().max(100).optional(),
  cursor: z.string().optional()
});

export const emailSchema = z.string().email('Invalid email address').max(255).toLowerCase().trim();

export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128);

export const nameSchema = z.string().trim().min(1, 'Name is required').max(100);
