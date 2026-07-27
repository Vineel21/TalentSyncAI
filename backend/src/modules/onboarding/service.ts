import type { Database } from '../../config/database.types.js';
import { BadRequestError, ConflictError } from '../../shared/errors.js';
import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { AiService } from '../ai/service.js';
import { toJobView } from '../jobs/types.js';
import type { OnboardingRepository } from './repository.js';
import {
  type CompleteOnboardingInput,
  missingReadinessFields,
  type OnboardingProfile,
  type OnboardingProgressInput,
  type OnboardingView,
  rankRecommendationJobs,
  type RecommendationView,
  toOnboardingView,
} from './types.js';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const assertReady = (profile: OnboardingProfile): void => {
  const missing = missingReadinessFields(profile);
  if (missing.length === 0) return;

  throw new BadRequestError(
    'Complete the required profile fields before continuing',
    'PROFILE_INCOMPLETE',
    missing.map((field) => ({
      field: `profile.${field}`,
      code: 'required',
      message: `${field} is required for onboarding`,
    })),
  );
};

export class OnboardingService {
  public constructor(
    private readonly repository: OnboardingRepository,
    private readonly aiService: AiService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async get(context: AuthenticatedContext): Promise<OnboardingView> {
    return toOnboardingView(await this.repository.getProfile(context.client, context.user.id));
  }

  public async updateProgress(
    context: AuthenticatedContext,
    input: OnboardingProgressInput,
  ): Promise<OnboardingView> {
    const profile = await this.repository.getProfile(context.client, context.user.id);
    if (profile.onboarding_completed_at) {
      throw new ConflictError('Onboarding has already been completed', 'ONBOARDING_COMPLETE');
    }
    if (input.step > profile.onboarding_step + 1) {
      throw new BadRequestError(
        'Onboarding steps must be completed in order',
        'INVALID_ONBOARDING_TRANSITION',
      );
    }

    const source = input.source ?? profile.onboarding_source;
    if (input.step >= 2 && !source) {
      throw new BadRequestError(
        'Choose resume extraction or manual entry before continuing',
        'ONBOARDING_SOURCE_REQUIRED',
        [
          {
            field: 'source',
            code: 'required',
            message: 'Choose resume or manual profile entry',
          },
        ],
      );
    }
    if (input.step === 3) assertReady(profile);

    const update: ProfileUpdate = {
      onboarding_step: input.step,
    };
    if (input.source !== undefined) update.onboarding_source = input.source;

    return toOnboardingView(
      await this.repository.updateProfile(context.client, context.user.id, update),
    );
  }

  public async recommendations(context: AuthenticatedContext): Promise<RecommendationView[]> {
    const referenceDate = this.now();
    const [profile, jobs] = await Promise.all([
      this.repository.getProfile(context.client, context.user.id),
      this.repository.listRecommendationJobs(context.client, referenceDate.toISOString()),
    ]);
    if (profile.onboarding_step !== 3 && !profile.onboarding_completed_at) {
      throw new BadRequestError(
        'Complete profile refinement before requesting recommendations',
        'INVALID_ONBOARDING_TRANSITION',
      );
    }
    assertReady(profile);
    const rankedJobs = rankRecommendationJobs(profile, jobs);

    return Promise.all(
      rankedJobs.map(async ({ job, fallbackMatch }): Promise<RecommendationView> => {
        try {
          const match = await this.aiService.calculateMatch(context, { jobId: job.id });
          return { job: toJobView(job), match, aiGenerated: true };
        } catch {
          return {
            job: toJobView(job),
            match: fallbackMatch,
            aiGenerated: false,
          };
        }
      }),
    );
  }

  public async complete(
    context: AuthenticatedContext,
    input: CompleteOnboardingInput,
  ): Promise<OnboardingView> {
    const profile = await this.repository.getProfile(context.client, context.user.id);
    if (profile.onboarding_completed_at) return toOnboardingView(profile);
    if (profile.onboarding_step !== 3 || !profile.onboarding_source) {
      throw new BadRequestError(
        'Complete each onboarding step before finishing',
        'INVALID_ONBOARDING_TRANSITION',
      );
    }
    assertReady(profile);

    const completedAt = this.now().toISOString();
    const update: ProfileUpdate = {
      onboarding_step: 3,
      onboarding_completed_at: completedAt,
      recommendations_skipped_at: input.skippedRecommendations ? completedAt : null,
    };
    return toOnboardingView(
      await this.repository.updateProfile(context.client, context.user.id, update),
    );
  }
}
