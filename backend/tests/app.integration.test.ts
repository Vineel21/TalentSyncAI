import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API integration', () => {
  it('returns a typed health response', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'TalentSync API is healthy',
      data: {
        status: 'ok',
        environment: 'test',
      },
    });
  });

  it('returns the standard envelope for unknown routes', async () => {
    const response = await request(createApp()).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route GET /api/v1/does-not-exist was not found',
      data: {
        code: 'ROUTE_NOT_FOUND',
        errors: [],
      },
    });
  });

  it('reports structured request validation errors', async () => {
    const response = await request(createApp()).post('/api/v1/auth/register').send({
      fullName: '',
      email: 'not-an-email',
      password: 'short',
      role: 'administrator',
    });

    expect(response.status).toBe(400);
    const responseBody: unknown = response.body;
    expect(responseBody).toMatchObject({
      success: false,
      data: {
        code: 'VALIDATION_ERROR',
      },
    });
    if (
      typeof responseBody !== 'object' ||
      responseBody === null ||
      !('data' in responseBody) ||
      typeof responseBody.data !== 'object' ||
      responseBody.data === null ||
      !('errors' in responseBody.data)
    ) {
      throw new Error('Expected a structured validation error response');
    }
    expect(Array.isArray(responseBody.data.errors)).toBe(true);
  });

  it('allows logout with an expired access token and clears the refresh cookie', async () => {
    const response = await request(createApp())
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer expired-access-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Signed out successfully',
      data: null,
    });
    expect(response.headers['set-cookie']?.[0]).toContain('talentsync_refresh=');
    expect(response.headers['set-cookie']?.[0]).toContain('Expires=Thu, 01 Jan 1970');
  });

  it.each(['/api/v1/onboarding', '/api/v1/saved-jobs'])(
    'protects the candidate feature route %s',
    async (path) => {
      const response = await request(createApp()).get(path);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        data: { code: 'UNAUTHENTICATED' },
      });
    },
  );
});
