import type { NextFunction, Request, RequestHandler, Response } from 'express';

type MaybeAsyncRequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => void | Response | Promise<unknown>;

export const asyncHandler = (handler: MaybeAsyncRequestHandler): RequestHandler => {
  return (request, response, next): void => {
    void Promise.resolve(handler(request, response, next)).catch(next);
  };
};
