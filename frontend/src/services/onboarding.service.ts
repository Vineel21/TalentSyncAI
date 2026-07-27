import { api, GEMINI_REQUEST_TIMEOUT_MS } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type {
  ApiResponse,
  CandidateOnboarding,
  JobRecommendation,
  OnboardingSource,
  OnboardingStep,
} from '@/types/api';

function onboardingFrom(response: ApiResponse<{ onboarding: CandidateOnboarding }>) {
  return getData(response).onboarding;
}

export const onboardingService = {
  async get() {
    return onboardingFrom(
      (await api.get<ApiResponse<{ onboarding: CandidateOnboarding }>>('/onboarding')).data,
    );
  },
  async updateProgress(input: { step: OnboardingStep; source?: OnboardingSource }) {
    return onboardingFrom(
      (
        await api.patch<ApiResponse<{ onboarding: CandidateOnboarding }>>(
          '/onboarding/progress',
          input,
        )
      ).data,
    );
  },
  async recommendations() {
    return getData(
      (
        await api.post<ApiResponse<{ recommendations: JobRecommendation[] }>>(
          '/onboarding/recommendations',
          {},
          { timeout: GEMINI_REQUEST_TIMEOUT_MS },
        )
      ).data,
    ).recommendations;
  },
  async complete(skippedRecommendations: boolean) {
    return onboardingFrom(
      (
        await api.post<ApiResponse<{ onboarding: CandidateOnboarding }>>('/onboarding/complete', {
          skippedRecommendations,
        })
      ).data,
    );
  },
};
