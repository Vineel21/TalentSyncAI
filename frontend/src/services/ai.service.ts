import { api } from '@/lib/api-client';
import { getData } from '@/services/api-helpers';
import type { ApiResponse, MatchResult } from '@/types/api';

export const aiService = {
  async candidateMatchScore(jobId: string) {
    return getData(
      (await api.post<ApiResponse<{ analysis: MatchResult }>>('/ai/match-score', { jobId })).data,
    ).analysis;
  },
  async applicationMatchScore(applicationId: string) {
    return getData(
      (await api.post<ApiResponse<{ analysis: MatchResult }>>('/ai/match-score', { applicationId }))
        .data,
    ).analysis;
  },
  async candidateSummary(applicationId: string) {
    return getData(
      (
        await api.post<ApiResponse<{ analysis: { summary: string } }>>('/ai/candidate-summary', {
          applicationId,
        })
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
        >('/ai/resume-feedback', { applicationId })
      ).data,
    ).analysis;
  },
};
