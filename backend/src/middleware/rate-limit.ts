import rateLimit, { type Options } from 'express-rate-limit';
import type { ApiFailure } from '../shared/api-response.js';

const createLimiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response): void => {
      const payload: ApiFailure = {
        success: false,
        message,
        data: {
          code: 'RATE_LIMIT_EXCEEDED',
          errors: [],
        },
      };
      response.status(429).json(payload);
    },
  } satisfies Partial<Options>);

export const globalRateLimit = createLimiter(
  15 * 60 * 1_000,
  500,
  'Too many requests; try again later',
);

export const authRateLimit = createLimiter(
  15 * 60 * 1_000,
  20,
  'Too many authentication attempts; try again later',
);

export const uploadRateLimit = createLimiter(
  60 * 60 * 1_000,
  20,
  'Too many resume uploads; try again later',
);

export const aiRateLimit = createLimiter(
  60 * 60 * 1_000,
  40,
  'Too many AI analysis requests; try again later',
);
