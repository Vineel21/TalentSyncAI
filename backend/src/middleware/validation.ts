import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { BadRequestError } from '../shared/errors.js';

export interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validateRequest = (schemas: RequestSchemas): RequestHandler => {
  return (request, _response, next): void => {
    const errors = [];
    const validated: Express.Request['validated'] = {};

    for (const key of ['body', 'params', 'query'] as const) {
      const schema = schemas[key];
      if (!schema) {
        continue;
      }
      const result = schema.safeParse(request[key]);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: [key, ...issue.path].join('.'),
            code: issue.code,
            message: issue.message,
          })),
        );
      } else {
        validated[key] = result.data;
      }
    }

    if (errors.length > 0) {
      next(new BadRequestError('Request validation failed', 'VALIDATION_ERROR', errors));
      return;
    }

    request.validated = validated;
    next();
  };
};

export const validatedBody = <T>(request: Express.Request): T => request.validated?.body as T;

export const validatedParams = <T>(request: Express.Request): T => request.validated?.params as T;

export const validatedQuery = <T>(request: Express.Request): T => request.validated?.query as T;
