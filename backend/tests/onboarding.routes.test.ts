import express, { type RequestHandler } from 'express';
import request from 'supertest';
import type { UserRole, UserRow } from '../src/config/database.types.js';
import type { DatabaseClient } from '../src/config/supabase.js';
import { authorize } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { OnboardingController } from '../src/modules/onboarding/controller.js';
import { createOnboardingRoutes } from '../src/modules/onboarding/routes.js';
import type { OnboardingService } from '../src/modules/onboarding/service.js';
import type { AuthenticatedContext } from '../src/shared/request-context.js';

const candidateId = '11111111-1111-4111-8111-111111111111';

const contextFor = (role: UserRole): AuthenticatedContext => ({
  accessToken: `${role}-token`,
  client: {} as DatabaseClient,
  user: {
    id: candidateId,
    email: `${role}@example.com`,
    role,
    created_at: '2026-07-27T00:00:00.000Z',
    updated_at: '2026-07-27T00:00:00.000Z',
  } satisfies UserRow,
});

const passThrough: RequestHandler = (_request, _response, next): void => {
  next();
};

const createTestApp = (service: OnboardingService, role: UserRole = 'candidate') => {
  const authenticate: RequestHandler = (incomingRequest, _response, next): void => {
    incomingRequest.auth = contextFor(role);
    next();
  };
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1/onboarding',
    createOnboardingRoutes(
      new OnboardingController(service),
      authenticate,
      authorize('candidate'),
      passThrough,
    ),
  );
  app.use(errorHandler);
  return app;
};

describe('onboarding route contracts', () => {
  it('returns the documented onboarding envelope', async () => {
    const get = vi.fn().mockResolvedValue({
      currentStep: 2,
      source: 'manual',
      completedAt: null,
      recommendationsSkippedAt: null,
    });
    const app = createTestApp({ get } as unknown as OnboardingService);

    const response = await request(app).get('/api/v1/onboarding');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Onboarding progress retrieved',
      data: {
        onboarding: {
          currentStep: 2,
          source: 'manual',
          completedAt: null,
          recommendationsSkippedAt: null,
        },
      },
    });
  });

  it('rejects invalid step numbers before the controller', async () => {
    const updateProgress = vi.fn();
    const app = createTestApp({ updateProgress } as unknown as OnboardingService);

    const response = await request(app)
      .patch('/api/v1/onboarding/progress')
      .send({ step: 4, source: 'manual' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      data: {
        code: 'VALIDATION_ERROR',
        errors: [expect.objectContaining({ field: 'body.step' })],
      },
    });
    expect(updateProgress).not.toHaveBeenCalled();
  });

  it('returns recommendation fallback data in the documented envelope', async () => {
    const recommendations = vi.fn().mockResolvedValue([
      {
        job: { id: '22222222-2222-4222-8222-222222222222' },
        match: { score: 75, recommendation: 'good_match' },
        aiGenerated: false,
      },
    ]);
    const app = createTestApp({ recommendations } as unknown as OnboardingService);

    const response = await request(app).post('/api/v1/onboarding/recommendations').send({});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        recommendations: [
          {
            aiGenerated: false,
            match: { score: 75, recommendation: 'good_match' },
          },
        ],
      },
    });
  });

  it('rejects recruiter access before onboarding service work', async () => {
    const get = vi.fn();
    const app = createTestApp({ get } as unknown as OnboardingService, 'recruiter');

    const response = await request(app).get('/api/v1/onboarding');

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      data: { code: 'FORBIDDEN' },
    });
    expect(get).not.toHaveBeenCalled();
  });
});
