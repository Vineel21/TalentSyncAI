import { z } from 'zod';

export const resumeUploadBodySchema = z.object({}).strict();

export const resumeDownloadQuerySchema = z.object({
  applicationId: z.uuid().optional(),
});
