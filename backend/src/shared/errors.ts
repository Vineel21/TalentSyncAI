import type { PostgrestError } from '@supabase/supabase-js';

export interface ErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  public constructor(message: string, code = 'BAD_REQUEST', details: ErrorDetail[] = []) {
    super(400, code, message, details);
  }
}

export class AuthenticationError extends AppError {
  public constructor(message = 'Authentication is required', code = 'UNAUTHENTICATED') {
    super(401, code, message);
  }
}

export class AuthorizationError extends AppError {
  public constructor(message = 'You are not allowed to perform this action') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  public constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} was not found`);
  }
}

export class ConflictError extends AppError {
  public constructor(message: string, code = 'CONFLICT') {
    super(409, code, message);
  }
}

export class ServiceUnavailableError extends AppError {
  public constructor(message: string, code = 'SERVICE_UNAVAILABLE') {
    super(503, code, message);
  }
}

export const throwDatabaseError = (error: PostgrestError, fallbackMessage: string): never => {
  if (error.code === '23505') {
    throw new ConflictError('The resource already exists', 'DUPLICATE_RESOURCE');
  }
  if (error.code === '23503') {
    throw new BadRequestError('A related resource does not exist', 'INVALID_RELATION');
  }
  throw new AppError(500, 'DATABASE_ERROR', fallbackMessage);
};
