import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError, BadRequestError } from '../shared/errors.js';
import type { ApiFailure } from '../shared/api-response.js';

export const notFoundHandler: RequestHandler = (request, _response, next): void => {
  next(
    new AppError(404, 'ROUTE_NOT_FOUND', `Route ${request.method} ${request.path} was not found`),
  );
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  let normalizedError: AppError;

  if (error instanceof AppError) {
    normalizedError = error;
  } else if (error instanceof MulterError) {
    normalizedError = new BadRequestError(
      error.code === 'LIMIT_FILE_SIZE' ? 'Resume must be 5 MB or smaller' : error.message,
      'UPLOAD_ERROR',
    );
  } else if (error instanceof ZodError) {
    normalizedError = new BadRequestError(
      'Request validation failed',
      'VALIDATION_ERROR',
      error.issues.map((issue) => ({
        field: issue.path.join('.'),
        code: issue.code,
        message: issue.message,
      })),
    );
  } else if (error instanceof SyntaxError && 'body' in error) {
    normalizedError = new BadRequestError('Request body is not valid JSON', 'INVALID_JSON');
  } else {
    normalizedError = new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  if (env.NODE_ENV !== 'production' && !(error instanceof AppError)) {
    console.error(error);
  }

  const payload: ApiFailure = {
    success: false,
    message: normalizedError.message,
    data: {
      code: normalizedError.code,
      errors: normalizedError.details,
    },
  };

  response.status(normalizedError.statusCode).json(payload);
};
