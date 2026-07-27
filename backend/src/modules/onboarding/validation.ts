import { z } from 'zod';

export const onboardingQuerySchema = z.object({}).strict();
export const onboardingRecommendationsSchema = z.object({}).strict();

export const onboardingProgressSchema = z
  .object({
    step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    source: z.enum(['resume', 'manual']).optional(),
  })
  .strict();

export const completeOnboardingSchema = z
  .object({
    skippedRecommendations: z.boolean(),
  })
  .strict();
