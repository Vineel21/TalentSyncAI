import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { ApplicationsController } from './controller.js';
import {
  applicationCreateSchema,
  applicationIdParamsSchema,
  applicationListQuerySchema,
  applicationStatusUpdateSchema,
} from './validation.js';

export const createApplicationsRoutes = (
  controller: ApplicationsController,
  authenticate: RequestHandler,
  candidateOnly: RequestHandler,
  recruiterOnly: RequestHandler,
): Router => {
  const router = Router();
  router.use(authenticate);

  router.post(
    '/',
    candidateOnly,
    validateRequest({ body: applicationCreateSchema }),
    asyncHandler(controller.create),
  );
  router.get(
    '/',
    validateRequest({ query: applicationListQuerySchema }),
    asyncHandler(controller.list),
  );
  router.get(
    '/:id',
    validateRequest({ params: applicationIdParamsSchema }),
    asyncHandler(controller.get),
  );
  router.patch(
    '/:id/status',
    recruiterOnly,
    validateRequest({
      params: applicationIdParamsSchema,
      body: applicationStatusUpdateSchema,
    }),
    asyncHandler(controller.updateStatus),
  );
  router.patch(
    '/:id/withdraw',
    candidateOnly,
    validateRequest({ params: applicationIdParamsSchema }),
    asyncHandler(controller.withdraw),
  );
  router.delete(
    '/:id',
    candidateOnly,
    validateRequest({ params: applicationIdParamsSchema }),
    asyncHandler(controller.withdraw),
  );

  return router;
};
