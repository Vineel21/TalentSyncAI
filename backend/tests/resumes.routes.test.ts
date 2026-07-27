import express, { type RequestHandler } from 'express';
import request from 'supertest';
import type { DatabaseClient } from '../src/config/supabase.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { ResumesController } from '../src/modules/resumes/controller.js';
import { createResumesRoutes } from '../src/modules/resumes/routes.js';
import type { ResumesService } from '../src/modules/resumes/service.js';
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
  },
};
const validPdf = Buffer.from('%PDF-1.4\nresume content\n%%EOF');

const passThrough: RequestHandler = (_request, _response, next): void => {
  next();
};

const createUploadApp = (controller: ResumesController) => {
  const authenticate: RequestHandler = (incomingRequest, _response, next): void => {
    incomingRequest.auth = candidateContext;
    next();
  };
  const app = express();
  app.use(
    '/api/v1/resume',
    createResumesRoutes(controller, authenticate, passThrough, passThrough, passThrough),
  );
  app.use(errorHandler);
  return app;
};

describe('resume upload body validation', () => {
  it('rejects the deprecated Gemini consent field', async () => {
    const upload = vi.fn();
    const app = createUploadApp({ upload } as unknown as ResumesController);

    const response = await request(app)
      .post('/api/v1/resume/upload')
      .field('geminiConsentVersion', '2026-07-27')
      .attach('file', validPdf, {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      data: {
        code: 'VALIDATION_ERROR',
        errors: [
          expect.objectContaining({
            field: 'body',
            code: 'unrecognized_keys',
          }),
        ],
      },
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it('accepts a file-only upload with an empty multipart body', async () => {
    const upload = vi.fn().mockResolvedValue({
      analysisId: '22222222-2222-4222-8222-222222222222',
      resumePath: `${candidateContext.user.id}/resume.pdf`,
      originalFilename: 'resume.pdf',
      status: 'pending',
    });
    const controller = new ResumesController({ upload } as unknown as ResumesService);
    const app = createUploadApp(controller);

    const response = await request(app).post('/api/v1/resume/upload').attach('file', validPdf, {
      filename: 'resume.pdf',
      contentType: 'application/pdf',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        resume: {
          analysisId: '22222222-2222-4222-8222-222222222222',
        },
      },
    });
    expect(upload).toHaveBeenCalledWith(
      candidateContext,
      expect.objectContaining({
        originalname: 'resume.pdf',
        mimetype: 'application/pdf',
      }),
    );
  });
});
