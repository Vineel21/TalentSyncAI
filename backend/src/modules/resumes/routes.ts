import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { validateRequest } from '../../middleware/validation.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { BadRequestError } from '../../shared/errors.js';
import type { ResumesController } from './controller.js';
import { resumeDownloadQuerySchema, resumeUploadBodySchema } from './validation.js';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_BYTES,
    files: 1,
    fields: 5,
  },
});

const validateResumeFile: RequestHandler = (request, _response, next): void => {
  const file = request.file;
  if (!file) {
    next(new BadRequestError('A PDF file is required in the file field', 'RESUME_FILE_REQUIRED'));
    return;
  }
  const header = file.buffer.subarray(0, 5).toString('ascii');
  const trailer = file.buffer.subarray(Math.max(0, file.buffer.length - 1_024)).toString('ascii');
  if (
    file.mimetype.toLowerCase() !== 'application/pdf' ||
    header !== '%PDF-' ||
    !trailer.includes('%%EOF') ||
    file.size === 0 ||
    file.size > MAX_RESUME_BYTES
  ) {
    next(
      new BadRequestError('Resume must be a valid PDF no larger than 5 MB', 'INVALID_RESUME_FILE'),
    );
    return;
  }
  next();
};

export const createResumesRoutes = (
  controller: ResumesController,
  authenticate: RequestHandler,
  candidateOnly: RequestHandler,
  uploadRateLimit: RequestHandler,
  aiRateLimit: RequestHandler,
): Router => {
  const router = Router();
  router.use(authenticate);

  router.post(
    '/upload',
    candidateOnly,
    uploadRateLimit,
    upload.single('file'),
    validateResumeFile,
    validateRequest({ body: resumeUploadBodySchema }),
    asyncHandler(controller.upload),
  );
  router.post('/parse', candidateOnly, aiRateLimit, asyncHandler(controller.parse));
  router.get(
    '/download',
    validateRequest({ query: resumeDownloadQuerySchema }),
    asyncHandler(controller.download),
  );

  return router;
};
