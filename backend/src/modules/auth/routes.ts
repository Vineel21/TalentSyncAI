import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../shared/async-handler.js';
import { validateRequest } from '../../middleware/validation.js';
import type { AuthController } from './controller.js';
import { loginSchema, registerSchema } from './validation.js';

export const createAuthRoutes = (
  controller: AuthController,
  authenticate: RequestHandler,
  authRateLimit: RequestHandler,
): Router => {
  const router = Router();

  router.post(
    '/register',
    authRateLimit,
    validateRequest({ body: registerSchema }),
    asyncHandler(controller.register),
  );
  router.post(
    '/login',
    authRateLimit,
    validateRequest({ body: loginSchema }),
    asyncHandler(controller.login),
  );
  router.post('/refresh', authRateLimit, asyncHandler(controller.refresh));
  router.post('/logout', authRateLimit, asyncHandler(controller.logout));
  router.get('/me', authenticate, asyncHandler(controller.me));

  return router;
};
