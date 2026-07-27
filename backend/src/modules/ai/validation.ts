import { z } from 'zod';

export const applicationAnalysisSchema = z.object({
  applicationId: z.uuid(),
});

export const matchAnalysisSchema = z.union([
  z.object({ jobId: z.uuid() }).strict(),
  z.object({ applicationId: z.uuid() }).strict(),
]);
