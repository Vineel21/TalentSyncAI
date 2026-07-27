import type { Request, Response } from 'express';
import { validatedBody } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import type { AiService } from './service.js';
import type { ApplicationAnalysisInput, MatchAnalysisInput } from './types.js';

export class AiController {
  public constructor(private readonly service: AiService) {}

  public match = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const analysis = await this.service.calculateMatch(
      request.auth,
      validatedBody<MatchAnalysisInput>(request),
    );
    return sendSuccess(response, 200, 'Match score generated', { analysis });
  };

  public summary = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { applicationId } = validatedBody<ApplicationAnalysisInput>(request);
    const analysis = await this.service.generateSummary(request.auth, applicationId);
    return sendSuccess(response, 200, 'Candidate summary generated', { analysis });
  };

  public feedback = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const { applicationId } = validatedBody<ApplicationAnalysisInput>(request);
    const analysis = await this.service.generateFeedback(request.auth, applicationId);
    return sendSuccess(response, 200, 'Resume feedback generated', { analysis });
  };
}
