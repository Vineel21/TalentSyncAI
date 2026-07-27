import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { SavedJobsController } from './controller.js';
import { savedJobParamsSchema, savedJobsQuerySchema } from './validation.js';

export const createSavedJobsRoutes = (
  controller: SavedJobsController,
  authenticate: RequestHandler,
  candidateOnly: RequestHandler,
): Router => {
  const router = Router();
  router.use(authenticate, candidateOnly);

  router.get('/', validateRequest({ query: savedJobsQuerySchema }), asyncHandler(controller.list));
  router.post(
    '/:jobId',
    validateRequest({ params: savedJobParamsSchema }),
    asyncHandler(controller.save),
  );
  router.delete(
    '/:jobId',
    validateRequest({ params: savedJobParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
};
