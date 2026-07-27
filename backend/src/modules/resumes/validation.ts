import { z } from 'zod';
import { CURRENT_GEMINI_CONSENT_VERSION } from '../ai/consent.js';

export const resumeUploadBodySchema = z
  .object({
    geminiConsentVersion: z.literal(CURRENT_GEMINI_CONSENT_VERSION),
  })
  .strict();

export const resumeDownloadQuerySchema = z.object({
  applicationId: z.uuid().optional(),
});
