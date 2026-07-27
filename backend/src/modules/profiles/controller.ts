import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import { validatedBody, validatedParams } from '../../middleware/validation.js';
import type { ProfilesService } from './service.js';
import type { ProfileUpdateInput } from './types.js';

export class ProfilesController {
  public constructor(private readonly service: ProfilesService) {}

  public getOwn = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const profile = await this.service.getOwn(request.auth);
    return sendSuccess(response, 200, 'Profile retrieved', { profile });
  };

  public updateOwn = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const profile = await this.service.updateOwn(
      request.auth,
      validatedBody<ProfileUpdateInput>(request),
    );
    return sendSuccess(response, 200, 'Profile updated', { profile });
  };

  public getById = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { id } = validatedParams<{ id: string }>(request);
    const profile = await this.service.getRecruiterView(request.auth, id);
    return sendSuccess(response, 200, 'Candidate profile retrieved', { profile });
  };
}
