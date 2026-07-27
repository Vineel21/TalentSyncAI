import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import type { NotificationsController } from './controller.js';
import {
  notificationIdParamsSchema,
  notificationListQuerySchema,
  notificationReadSchema,
} from './validation.js';

export const createNotificationsRoutes = (
  controller: NotificationsController,
  authenticate: RequestHandler,
): Router => {
  const router = Router();
  router.use(authenticate);

  router.get(
    '/',
    validateRequest({ query: notificationListQuerySchema }),
    asyncHandler(controller.list),
  );
  router.patch('/read-all', asyncHandler(controller.markAllRead));
  router.patch(
    '/read',
    validateRequest({ body: notificationReadSchema }),
    asyncHandler(controller.markRead),
  );
  router.patch(
    '/:id/read',
    validateRequest({ params: notificationIdParamsSchema }),
    asyncHandler(controller.markRead),
  );
  router.delete(
    '/:id',
    validateRequest({ params: notificationIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
};
