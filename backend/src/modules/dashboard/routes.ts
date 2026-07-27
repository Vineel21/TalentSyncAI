import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { DashboardController } from './controller.js';
import { dashboardQuerySchema } from './validation.js';

export const createDashboardRoutes = (
  controller: DashboardController,
  authenticate: RequestHandler,
): Router => {
  const router = Router();
  router.get(
    '/',
    authenticate,
    validateRequest({ query: dashboardQuerySchema }),
    asyncHandler(controller.get),
  );
  return router;
};
