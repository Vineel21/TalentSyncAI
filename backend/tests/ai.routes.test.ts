import express, { type RequestHandler } from 'express';
import request from 'supertest';
import type { UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import { authorize } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import type { AiController } from '../src/modules/ai/controller.js';
import { createAiRoutes } from '../src/modules/ai/routes.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const candidateContext: AuthenticatedContext = {
  accessToken: 'candidate-access-token',
  client: {} as DatabaseClient,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'candidate@example.com',
    role: 'candidate',
    created_at: '2026-07-27T00:00:00.000Z',
    updated_at: '2026-07-27T00:00:00.000Z',
  } satisfies UserRow,
};

describe('AI route authorization', () => {
  it.each(['/candidate-summary', '/resume-feedback'])(
    'rejects candidates from POST %s before the controller',
    async (path) => {
      const controller = {
        match: vi.fn(),
        summary: vi.fn(),
        feedback: vi.fn(),
      } as unknown as AiController;
      const authenticateCandidate: RequestHandler = (request, _response, next): void => {
        request.auth = candidateContext;
        next();
      };
      const continueRequest: RequestHandler = (_request, _response, next): void => {
        next();
      };
      const app = express();
      app.use(express.json());
      app.use(
        '/api/v1/ai',
        createAiRoutes(controller, authenticateCandidate, authorize('recruiter'), continueRequest),
      );
      app.use(errorHandler);

      const response = await request(app)
        .post(`/api/v1/ai${path}`)
        .send({ applicationId: '22222222-2222-4222-8222-222222222222' });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        data: {
          code: 'FORBIDDEN',
        },
      });
      expect(controller.summary).not.toHaveBeenCalled();
      expect(controller.feedback).not.toHaveBeenCalled();
    },
  );
});
