import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { JobsController } from './controller.js';
import {
  jobCreateSchema,
  jobIdParamsSchema,
  jobListQuerySchema,
  jobStatusUpdateSchema,
  jobUpdateSchema,
} from './validation.js';

export const createJobsRoutes = (
  controller: JobsController,
  authenticate: RequestHandler,
  optionalAuthenticate: RequestHandler,
  recruiterOnly: RequestHandler,
): Router => {
  const router = Router();
  router.get(
    '/',
    optionalAuthenticate,
    validateRequest({ query: jobListQuerySchema }),
    asyncHandler(controller.list),
  );
  router.get(
    '/:id',
    optionalAuthenticate,
    validateRequest({ params: jobIdParamsSchema }),
    asyncHandler(controller.get),
  );
  router.post(
    '/',
    authenticate,
    recruiterOnly,
    validateRequest({ body: jobCreateSchema }),
    asyncHandler(controller.create),
  );
  router.put(
    '/:id',
    authenticate,
    recruiterOnly,
    validateRequest({ params: jobIdParamsSchema, body: jobUpdateSchema }),
    asyncHandler(controller.update),
  );
  router.patch(
    '/:id/status',
    authenticate,
    recruiterOnly,
    validateRequest({ params: jobIdParamsSchema, body: jobStatusUpdateSchema }),
    asyncHandler(controller.setStatus),
  );
  router.delete(
    '/:id',
    authenticate,
    recruiterOnly,
    validateRequest({ params: jobIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
};
