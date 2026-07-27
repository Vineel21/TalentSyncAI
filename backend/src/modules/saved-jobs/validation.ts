import { z } from 'zod';

export const savedJobsQuerySchema = z.object({}).strict();

export const savedJobParamsSchema = z
  .object({
    jobId: z.uuid(),
  })
  .strict();
