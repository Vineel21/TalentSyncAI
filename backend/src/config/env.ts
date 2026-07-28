import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    FRONTEND_URL: z
      .string()
      .default('http://localhost:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    SUPABASE_URL: z.url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_RESUME_BUCKET: z.string().min(1).default('resume-files'),
    GEMINI_API_KEY: z
      .string()
      .optional()
      .transform((value) => value?.trim() || undefined),
    GEMINI_MODEL: z.string().min(1).default('gemini-3.6-flash'),
    GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),
    GEMINI_SERVICE_TIER: z.enum(['unpaid', 'paid']).default('unpaid'),
    AI_PROCESSING_MODE: z.enum(['assessment', 'live']).default('assessment'),
    COOKIE_DOMAIN: z
      .string()
      .optional()
      .transform((value) => value?.trim() || undefined),
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(1),
    LOG_FORMAT: z.string().min(1).default('dev'),
  })
  .superRefine((value, context) => {
    if (value.AI_PROCESSING_MODE === 'live' && !value.GEMINI_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['GEMINI_API_KEY'],
        message: 'Required when AI_PROCESSING_MODE is live',
      });
    }
    if (value.AI_PROCESSING_MODE === 'live' && value.GEMINI_SERVICE_TIER !== 'paid') {
      context.addIssue({
        code: 'custom',
        path: ['GEMINI_SERVICE_TIER'],
        message: 'Must be paid when AI_PROCESSING_MODE is live',
      });
    }
  });

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid backend environment: ${issues}`);
}

export const env = parsedEnvironment.data;

export type Environment = typeof env;
