import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { createAuthenticate, createOptionalAuthenticate, authorize } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import {
  aiRateLimit,
  authRateLimit,
  globalRateLimit,
  uploadRateLimit,
} from './middleware/rate-limit.js';
import { AuthController } from './modules/auth/controller.js';
import { AuthRepository } from './modules/auth/repository.js';
import { createAuthRoutes } from './modules/auth/routes.js';
import { AuthService } from './modules/auth/service.js';
import { ProfilesController } from './modules/profiles/controller.js';
import { ProfilesRepository } from './modules/profiles/repository.js';
import { createOwnProfileRoutes, createRecruiterProfileRoutes } from './modules/profiles/routes.js';
import { ProfilesService } from './modules/profiles/service.js';
import { JobsController } from './modules/jobs/controller.js';
import { JobsRepository } from './modules/jobs/repository.js';
import { createJobsRoutes } from './modules/jobs/routes.js';
import { JobsService } from './modules/jobs/service.js';
import { ApplicationsController } from './modules/applications/controller.js';
import { ApplicationsRepository } from './modules/applications/repository.js';
import { createApplicationsRoutes } from './modules/applications/routes.js';
import { ApplicationsService } from './modules/applications/service.js';
import { AiController } from './modules/ai/controller.js';
import { AiRepository } from './modules/ai/repository.js';
import { createAiRoutes } from './modules/ai/routes.js';
import { AiService } from './modules/ai/service.js';
import { ResumesController } from './modules/resumes/controller.js';
import { ResumesRepository } from './modules/resumes/repository.js';
import { createResumesRoutes } from './modules/resumes/routes.js';
import { ResumesService } from './modules/resumes/service.js';
import { DashboardController } from './modules/dashboard/controller.js';
import { DashboardRepository } from './modules/dashboard/repository.js';
import { createDashboardRoutes } from './modules/dashboard/routes.js';
import { DashboardService } from './modules/dashboard/service.js';
import { NotificationsController } from './modules/notifications/controller.js';
import { NotificationsRepository } from './modules/notifications/repository.js';
import { createNotificationsRoutes } from './modules/notifications/routes.js';
import { NotificationsService } from './modules/notifications/service.js';
import { OnboardingController } from './modules/onboarding/controller.js';
import { OnboardingRepository } from './modules/onboarding/repository.js';
import { createOnboardingRoutes } from './modules/onboarding/routes.js';
import { OnboardingService } from './modules/onboarding/service.js';
import { SavedJobsController } from './modules/saved-jobs/controller.js';
import { SavedJobsRepository } from './modules/saved-jobs/repository.js';
import { createSavedJobsRoutes } from './modules/saved-jobs/routes.js';
import { SavedJobsService } from './modules/saved-jobs/service.js';
import { sendSuccess } from './shared/api-response.js';
import { AuthorizationError } from './shared/errors.js';

const corsOptions: CorsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: ['Content-Disposition'],
  origin(origin, callback) {
    if (!origin || env.FRONTEND_URL.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AuthorizationError('Origin is not allowed by CORS'));
  },
};

export const createApp = (): Express => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(morgan(env.LOG_FORMAT));
  app.use('/api/v1', globalRateLimit);

  const authRepository = new AuthRepository();
  const authenticate = createAuthenticate(authRepository);
  const optionalAuthenticate = createOptionalAuthenticate(authRepository);
  const candidateOnly = authorize('candidate');
  const recruiterOnly = authorize('recruiter');

  const authController = new AuthController(new AuthService(authRepository));
  const profilesController = new ProfilesController(new ProfilesService(new ProfilesRepository()));
  const jobsController = new JobsController(new JobsService(new JobsRepository()));
  const applicationsController = new ApplicationsController(
    new ApplicationsService(new ApplicationsRepository()),
  );
  const aiService = new AiService(new AiRepository());
  const aiController = new AiController(aiService);
  const resumesController = new ResumesController(
    new ResumesService(new ResumesRepository(), aiService),
  );
  const savedJobsRepository = new SavedJobsRepository();
  const savedJobsController = new SavedJobsController(new SavedJobsService(savedJobsRepository));
  const onboardingController = new OnboardingController(
    new OnboardingService(new OnboardingRepository(), aiService),
  );
  const dashboardController = new DashboardController(
    new DashboardService(new DashboardRepository(), savedJobsRepository),
  );
  const notificationsController = new NotificationsController(
    new NotificationsService(new NotificationsRepository()),
  );

  app.get('/api/v1/health', (_request, response) =>
    sendSuccess(response, 200, 'TalentSync API is healthy', {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }),
  );
  app.use('/api/v1/auth', createAuthRoutes(authController, authenticate, authRateLimit));
  app.use(
    '/api/v1/profile',
    createOwnProfileRoutes(profilesController, authenticate, candidateOnly),
  );
  app.use(
    '/api/v1/profile',
    createRecruiterProfileRoutes(profilesController, authenticate, recruiterOnly),
  );
  app.use(
    '/api/v1/jobs',
    createJobsRoutes(jobsController, authenticate, optionalAuthenticate, recruiterOnly),
  );
  app.use(
    '/api/v1/applications',
    createApplicationsRoutes(applicationsController, authenticate, candidateOnly, recruiterOnly),
  );
  app.use(
    '/api/v1/resume',
    createResumesRoutes(
      resumesController,
      authenticate,
      candidateOnly,
      uploadRateLimit,
      aiRateLimit,
    ),
  );
  app.use('/api/v1/ai', createAiRoutes(aiController, authenticate, recruiterOnly, aiRateLimit));
  app.use(
    '/api/v1/onboarding',
    createOnboardingRoutes(onboardingController, authenticate, candidateOnly, aiRateLimit),
  );
  app.use(
    '/api/v1/saved-jobs',
    createSavedJobsRoutes(savedJobsController, authenticate, candidateOnly),
  );
  app.use('/api/v1/dashboard', createDashboardRoutes(dashboardController, authenticate));
  app.use(
    '/api/v1/notifications',
    createNotificationsRoutes(notificationsController, authenticate),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
