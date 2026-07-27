import type { Request, Response } from 'express';
import { validatedBody } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError } from '../../shared/errors.js';
import type { OnboardingService } from './service.js';
import type { CompleteOnboardingInput, OnboardingProgressInput } from './types.js';

export class OnboardingController {
  public constructor(private readonly service: OnboardingService) {}

  public get = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const onboarding = await this.service.get(request.auth);
    return sendSuccess(response, 200, 'Onboarding progress retrieved', { onboarding });
  };

  public updateProgress = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const onboarding = await this.service.updateProgress(
      request.auth,
      validatedBody<OnboardingProgressInput>(request),
    );
    return sendSuccess(response, 200, 'Onboarding progress updated', { onboarding });
  };

  public recommendations = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const recommendations = await this.service.recommendations(request.auth);
    return sendSuccess(response, 200, 'Job recommendations generated', { recommendations });
  };

  public complete = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const onboarding = await this.service.complete(
      request.auth,
      validatedBody<CompleteOnboardingInput>(request),
    );
    return sendSuccess(response, 200, 'Candidate onboarding completed', { onboarding });
  };
}
