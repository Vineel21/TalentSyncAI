import { z } from 'zod';

export const applicationStatusSchema = z.enum([
  'applied',
  'under_review',
  'shortlisted',
  'interview',
  'rejected',
  'offer',
  'withdrawn',
]);

export const applicationCreateSchema = z.object({
  jobId: z.uuid(),
  coverLetter: z.string().trim().min(20).max(10_000).nullable().default(null),
});

export const applicationListQuerySchema = z.object({
  status: applicationStatusSchema.optional(),
  jobId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const applicationIdParamsSchema = z.object({
  id: z.uuid(),
});

export const applicationStatusUpdateSchema = z.object({
  status: applicationStatusSchema,
});
