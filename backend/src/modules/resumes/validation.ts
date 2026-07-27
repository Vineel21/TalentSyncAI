import { z } from 'zod';

export const resumeDownloadQuerySchema = z.object({
  applicationId: z.uuid().optional(),
});
