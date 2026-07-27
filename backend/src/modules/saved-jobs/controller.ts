import type { Request, Response } from 'express';
import { validatedParams } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import type { SavedJobsService } from './service.js';

export class SavedJobsController {
  public constructor(private readonly service: SavedJobsService) {}

  public list = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const savedJobs = await this.service.list(request.auth);
    return sendSuccess(response, 200, 'Saved jobs retrieved', { savedJobs });
  };

  public save = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { jobId } = validatedParams<{ jobId: string }>(request);
    const savedJob = await this.service.save(request.auth, jobId);
    return sendSuccess(response, 201, 'Job saved', { savedJob });
  };

  public remove = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { jobId } = validatedParams<{ jobId: string }>(request);
    await this.service.remove(request.auth, jobId);
    return sendSuccess(response, 200, 'Saved job removed', null);
  };
}
