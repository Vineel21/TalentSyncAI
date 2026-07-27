import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import type { DashboardService } from './service.js';

export class DashboardController {
  public constructor(private readonly service: DashboardService) {}

  public get = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const dashboard = await this.service.get(request.auth);
    return sendSuccess(response, 200, 'Dashboard retrieved', dashboard);
  };
}
