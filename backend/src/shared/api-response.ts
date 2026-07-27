import type { Response } from 'express';
import type { ErrorDetail } from './errors.js';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  data: {
    code: string;
    errors: ErrorDetail[];
  };
}

export const sendSuccess = <T>(
  response: Response,
  statusCode: number,
  message: string,
  data: T,
): Response => {
  const payload: ApiSuccess<T> = {
    success: true,
    message,
    data,
  };

  response.status(statusCode).json(payload);
  return response;
};
