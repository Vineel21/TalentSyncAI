import type { Request, Response } from 'express';
import { validatedBody, validatedParams, validatedQuery } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import type { ApplicationsService } from './service.js';
import type { ApplicationCreateInput, ApplicationListInput } from './types.js';
import type { ApplicationStatus } from '../../config/database.types.js';

export class ApplicationsController {
  public constructor(private readonly service: ApplicationsService) {}

  public create = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const application = await this.service.create(
      request.auth,
      validatedBody<ApplicationCreateInput>(request),
    );
    return sendSuccess(response, 201, 'Application submitted', { application });
  };

  public list = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const data = await this.service.list(
      request.auth,
      validatedQuery<ApplicationListInput>(request),
    );
    return sendSuccess(response, 200, 'Applications retrieved', data);
  };

  public get = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    const application = await this.service.get(request.auth, id);
    return sendSuccess(response, 200, 'Application retrieved', { application });
  };

  public updateStatus = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    const { status } = validatedBody<{ status: ApplicationStatus }>(request);
    const application = await this.service.updateStatus(request.auth, id, status);
    return sendSuccess(response, 200, 'Application status updated', { application });
  };

  public withdraw = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    await this.service.withdraw(request.auth, id);
    return sendSuccess(response, 200, 'Application withdrawn', null);
  };
}
