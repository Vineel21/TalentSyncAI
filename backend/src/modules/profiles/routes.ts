import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { validateRequest } from '../../middleware/validation.js';
import type { ProfilesController } from './controller.js';
import { profileIdParamsSchema, profileUpdateSchema } from './validation.js';

export const createOwnProfileRoutes = (
  controller: ProfilesController,
  authenticate: RequestHandler,
  candidateOnly: RequestHandler,
): Router => {
  const router = Router();
  router.get('/', authenticate, candidateOnly, asyncHandler(controller.getOwn));
  router.put(
    '/',
    authenticate,
    candidateOnly,
    validateRequest({ body: profileUpdateSchema }),
    asyncHandler(controller.updateOwn),
  );
  return router;
};

export const createRecruiterProfileRoutes = (
  controller: ProfilesController,
  authenticate: RequestHandler,
  recruiterOnly: RequestHandler,
): Router => {
  const router = Router();
  router.get(
    '/:id',
    authenticate,
    recruiterOnly,
    validateRequest({ params: profileIdParamsSchema }),
    asyncHandler(controller.getById),
  );
  return router;
};
