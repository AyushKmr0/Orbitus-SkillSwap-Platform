import { z } from 'zod';

export const verifyCertificateParamSchema = z.object({
  params: z.object({
    uniqueId: z.string().trim().min(3, 'Invalid certificate identifier').max(100)
  })
});
