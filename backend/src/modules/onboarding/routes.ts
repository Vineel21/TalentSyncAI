import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { OnboardingController } from './controller.js';
import {
  completeOnboardingSchema,
  onboardingProgressSchema,
  onboardingQuerySchema,
  onboardingRecommendationsSchema,
} from './validation.js';

export const createOnboardingRoutes = (
  controller: OnboardingController,
  authenticate: RequestHandler,
  candidateOnly: RequestHandler,
  aiRateLimit: RequestHandler,
): Router => {
  const router = Router();
  router.use(authenticate, candidateOnly);

  router.get('/', validateRequest({ query: onboardingQuerySchema }), asyncHandler(controller.get));
  router.patch(
    '/progress',
    validateRequest({ body: onboardingProgressSchema }),
    asyncHandler(controller.updateProgress),
  );
  router.post(
    '/recommendations',
    aiRateLimit,
    validateRequest({ body: onboardingRecommendationsSchema }),
    asyncHandler(controller.recommendations),
  );
  router.post(
    '/complete',
    validateRequest({ body: completeOnboardingSchema }),
    asyncHandler(controller.complete),
  );

  return router;
};
