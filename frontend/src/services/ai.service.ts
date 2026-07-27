import { api, GEMINI_REQUEST_TIMEOUT_MS } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, MatchResult } from '@/types/api';

export const aiService = {
  async candidateMatchScore(jobId: string) {
    return getData(
      (
        await api.post<ApiResponse<{ analysis: MatchResult }>>(
          '/ai/match-score',
          { jobId },
          { timeout: GEMINI_REQUEST_TIMEOUT_MS },
        )
      ).data,
    ).analysis;
  },
  async applicationMatchScore(applicationId: string) {
    return getData(
      (
        await api.post<ApiResponse<{ analysis: MatchResult }>>(
          '/ai/match-score',
          { applicationId },
          { timeout: GEMINI_REQUEST_TIMEOUT_MS },
        )
      ).data,
    ).analysis;
  },
  async candidateSummary(applicationId: string) {
    return getData(
      (
        await api.post<ApiResponse<{ analysis: { summary: string } }>>(
          '/ai/candidate-summary',
          {
            applicationId,
          },
          { timeout: GEMINI_REQUEST_TIMEOUT_MS },
        )
      ).data,
    ).analysis;
  },
  async resumeFeedback(applicationId: string) {
    return getData(
      (
        await api.post<
          ApiResponse<{
            analysis: {
              grammar: string[];
              ats: string[];
              skills: string[];
              projects: string[];
              formatting: string[];
              achievements: string[];
            };
          }>
        >('/ai/resume-feedback', { applicationId }, { timeout: GEMINI_REQUEST_TIMEOUT_MS })
      ).data,
    ).analysis;
  },
};
