import type { Request, Response } from 'express';
import { validatedBody, validatedParams, validatedQuery } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AppError, AuthenticationError } from '../../shared/errors.js';
import type { JobsService } from './service.js';
import type { JobCreateInput, JobListInput, JobUpdateInput } from './types.js';

export class JobsController {
  public constructor(private readonly service: JobsService) {}

  public list = async (request: Request, response: Response): Promise<Response> => {
    if (!request.databaseClient) {
      throw new AppError(500, 'DATABASE_CLIENT_MISSING', 'Request database context is unavailable');
    }
    const data = await this.service.list(
      {
        client: request.databaseClient,
        user: request.auth?.user ?? null,
      },
      validatedQuery<JobListInput>(request),
    );
    return sendSuccess(response, 200, 'Jobs retrieved', data);
  };

  public get = async (request: Request, response: Response): Promise<Response> => {
    if (!request.databaseClient) {
      throw new AppError(500, 'DATABASE_CLIENT_MISSING', 'Request database context is unavailable');
    }
    const { id } = validatedParams<{ id: string }>(request);
    return sendSuccess(response, 200, 'Job retrieved', {
      job: await this.service.get(
        {
          client: request.databaseClient,
          user: request.auth?.user ?? null,
        },
        id,
      ),
    });
  };

  public create = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const job = await this.service.create(request.auth, validatedBody<JobCreateInput>(request));
    return sendSuccess(response, 201, 'Job created', { job });
  };

  public update = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    const job = await this.service.update(request.auth, id, validatedBody<JobUpdateInput>(request));
    return sendSuccess(response, 200, 'Job updated', { job });
  };

  public setStatus = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    const { status } = validatedBody<{ status: 'draft' | 'open' | 'closed' }>(request);
    const job = await this.service.setStatus(request.auth, id, status);
    return sendSuccess(response, 200, 'Job status updated', { job });
  };

  public remove = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    await this.service.remove(request.auth, id);
    return sendSuccess(response, 200, 'Job deleted', null);
  };
}
