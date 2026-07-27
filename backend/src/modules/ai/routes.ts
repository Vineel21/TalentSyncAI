import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { AiController } from './controller.js';
import { applicationAnalysisSchema, matchAnalysisSchema } from './validation.js';

export const createAiRoutes = (
  controller: AiController,
  authenticate: RequestHandler,
  recruiterOnly: RequestHandler,
  aiRateLimit: RequestHandler,
): Router => {
  const router = Router();
  router.use(authenticate, aiRateLimit);

  router.post(
    '/match-score',
    validateRequest({ body: matchAnalysisSchema }),
    asyncHandler(controller.match),
  );
  router.post(
    '/candidate-summary',
    recruiterOnly,
    validateRequest({ body: applicationAnalysisSchema }),
    asyncHandler(controller.summary),
  );
  router.post(
    '/resume-feedback',
    recruiterOnly,
    validateRequest({ body: applicationAnalysisSchema }),
    asyncHandler(controller.feedback),
  );

  return router;
};
