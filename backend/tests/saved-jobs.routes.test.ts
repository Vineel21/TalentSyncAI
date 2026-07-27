import express, { type RequestHandler } from 'express';
import request from 'supertest';
import type { UserRole, UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import { authorize } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { SavedJobsController } from '../src/modules/saved-jobs/controller.js';
import { createSavedJobsRoutes } from '../src/modules/saved-jobs/routes.js';
import type { SavedJobsService } from '../src/modules/saved-jobs/service.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const jobId = '22222222-2222-4222-8222-222222222222';

const contextFor = (role: UserRole): AuthenticatedContext => ({
  accessToken: `${role}-token`,
  client: {} as DatabaseClient,
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: `${role}@example.com`,
    role,
    created_at: '2026-07-27T00:00:00.000Z',
    updated_at: '2026-07-27T00:00:00.000Z',
  } satisfies UserRow,
});

const createTestApp = (service: SavedJobsService, role: UserRole = 'candidate') => {
  const authenticate: RequestHandler = (incomingRequest, _response, next): void => {
    incomingRequest.auth = contextFor(role);
    next();
  };
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1/saved-jobs',
    createSavedJobsRoutes(new SavedJobsController(service), authenticate, authorize('candidate')),
  );
  app.use(errorHandler);
  return app;
};

describe('saved jobs route contracts', () => {
  it('returns the saved-job view after a save', async () => {
    const save = vi.fn().mockResolvedValue({
      job: { id: jobId, title: 'Frontend Engineer' },
      savedAt: '2026-07-27T00:00:00.000Z',
    });
    const app = createTestApp({ save } as unknown as SavedJobsService);

    const response = await request(app).post(`/api/v1/saved-jobs/${jobId}`);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      message: 'Job saved',
      data: {
        savedJob: {
          job: { id: jobId, title: 'Frontend Engineer' },
          savedAt: '2026-07-27T00:00:00.000Z',
        },
      },
    });
  });

  it('rejects a non-UUID job id before service work', async () => {
    const remove = vi.fn();
    const app = createTestApp({ remove } as unknown as SavedJobsService);

    const response = await request(app).delete('/api/v1/saved-jobs/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      data: {
        code: 'VALIDATION_ERROR',
        errors: [expect.objectContaining({ field: 'params.jobId' })],
      },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('rejects recruiters before saved-job service work', async () => {
    const list = vi.fn();
    const app = createTestApp({ list } as unknown as SavedJobsService, 'recruiter');

    const response = await request(app).get('/api/v1/saved-jobs');

    expect(response.status).toBe(403);
    expect(list).not.toHaveBeenCalled();
  });
});
